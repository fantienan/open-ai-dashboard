<h1 align="center">AI Dashboard</h1>

通过自然语言对话，快速完成数据分析与数据看板（Dashboard）生成，无需编程基础，只需描述需求，AI自动解析数据关联，输出动态图表与商业洞察，帮助您完成分析报告，提高工作效率。支持导出数据看板代码，开发者可二次编辑分析逻辑，满足定制化商业分析场景。

## 环境变量

### `DEEPSEEK_API_KEY`  (必需的)
你的deepseek api key，用逗号链接多个api key。

### `DEEPSEEK_BASE_URL` (可选的)

> 默认值: `https://api.deepseek.com`

> Examples: `http://yourjproxy.com`

覆盖deepseek api请求的基本地址。

### `BIZ_WORKSPACE` (可选的)

> 默认值：程序的启动目录。

> 示例：C:\\xxxx\\xxxx 或 'C:/xxxx/xxxx'

工作空间目录的绝对地址。