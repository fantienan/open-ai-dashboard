use archflow::compress::FileOptions;
use archflow::compress::tokio::archive::ZipArchive;
use archflow::compression::CompressionMethod;
use std::io::Cursor;
use std::path::PathBuf;
use tokio::io::{DuplexStream, duplex};
use tokio_util::io::ReaderStream;
use walkdir::WalkDir;

#[derive(Clone)]
pub struct DownloadCodeOption {
  pub file_content: String,
  /// 相对src_dir的路径
  pub relative_file_path: String,
}

impl DownloadCodeOption {
  pub fn new(file_content: String, relative_file_path: String) -> Self {
    Self {
      file_content,
      relative_file_path,
    }
  }
}

pub async fn code<F>(
  src_dir: &PathBuf,
  options: Option<Vec<DownloadCodeOption>>,
  index_html_modifier: Option<F>,
) -> Result<ReaderStream<DuplexStream>, String>
where
  F: Fn(String) -> String + Send + 'static,
{
  if !src_dir.exists() {
    return Err(format!("模板目录不存在: {:?}", src_dir));
  }

  // 1. 创建内存双工管道
  let (writer, reader) = duplex(16 * 1024); // 16 KB 缓冲

  let owned_src_dir = src_dir.clone();
  let owned_options = options.clone();

  // 2. 后台任务：动态遍历目录并压缩写入 writer
  tokio::spawn(async move {
    let mut archive = ZipArchive::new_streamable(writer);
    let file_options = FileOptions::default().compression_method(CompressionMethod::Deflate());

    for entry in WalkDir::new(&owned_src_dir)
      .into_iter()
      .filter_map(Result::ok)
      .filter(|e| e.path().is_file())
    {
      let rel = entry
        .path()
        .strip_prefix(&owned_src_dir)
        .unwrap()
        .to_str()
        .unwrap();
      if rel == "index.html" && index_html_modifier.is_some() {
        let content = tokio::fs::read_to_string(entry.path()).await.unwrap();
        let modified_content = index_html_modifier.as_ref().unwrap()(content);
        let mut cursor = Cursor::new(modified_content.into_bytes());
        archive
          .append(rel, &file_options, &mut cursor)
          .await
          .unwrap();
      } else {
        let mut f = tokio::fs::File::open(entry.path()).await.unwrap();
        archive.append(rel, &file_options, &mut f).await.unwrap();
      }
    }

    if let Some(opts) = owned_options {
      for opt in opts {
        // 使用 Cursor 将字符串内容包装成一个 AsyncRead 实现
        let content_bytes = opt.file_content.into_bytes();
        let mut cursor = Cursor::new(content_bytes);
        archive
          .append(&opt.relative_file_path, &file_options, &mut cursor)
          .await
          .unwrap();
      }
    }

    archive.finalize().await.unwrap();
  });

  // 3. 将 reader 转流并返回 HTTP 响应
  let stream = ReaderStream::new(reader);
  Ok(stream)
}
