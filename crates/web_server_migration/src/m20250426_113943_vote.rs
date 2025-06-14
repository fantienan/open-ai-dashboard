use sea_orm_migration::{prelude::*, schema::*};

use crate::m20220101_000001_create_table::Chat;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(Vote::Table)
          .if_not_exists()
          .col(text(Vote::ChatId))
          .col(text(Vote::MessageId))
          .col(integer(Vote::IsUpvoted))
          .primary_key(Index::create().col(Vote::ChatId).col(Vote::MessageId))
          .foreign_key(
            ForeignKey::create()
              .name("fk_vote_chat_id")
              .from(Vote::Table, Vote::ChatId)
              .to(Chat::Table, Chat::Id)
              .on_delete(ForeignKeyAction::Cascade)
              .on_update(ForeignKeyAction::Cascade),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(Vote::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
enum Vote {
  Table,
  ChatId,
  MessageId,
  IsUpvoted,
}
