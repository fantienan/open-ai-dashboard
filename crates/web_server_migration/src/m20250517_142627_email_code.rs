use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(EmailCode::Table)
          .if_not_exists()
          .col(text(EmailCode::Email))
          .col(text(EmailCode::Code))
          .col(text(EmailCode::CreatedAt).default(Expr::current_timestamp()))
          .col(text_null(EmailCode::ConsumedAt))
          .primary_key(
            Index::create()
              .name("email_code_email_pk")
              .col(EmailCode::Email)
              .col(EmailCode::Code),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(EmailCode::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
enum EmailCode {
  Table,
  Email,
  Code,
  CreatedAt,
  ConsumedAt,
}
