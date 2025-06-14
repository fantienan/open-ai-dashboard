use sea_orm_migration::{prelude::*, schema::*};

use crate::m20220101_000001_create_table::Chat;
use crate::m20250426_102845_message::Message;
use crate::m20250426_112536_user::User;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(Dashboard::Table)
          .if_not_exists()
          .col(text(Dashboard::ChatId))
          .col(text(Dashboard::MessageId))
          .col(text(Dashboard::CreatedAt).default(Expr::current_timestamp()))
          .col(text(Dashboard::UserId))
          .col(text(Dashboard::Data).json())
          .primary_key(
            Index::create()
              .name("dashboard_chat_id_message_id_pk")
              .col(Dashboard::ChatId)
              .col(Dashboard::MessageId),
          )
          .foreign_key(
            ForeignKey::create()
              .name("fk_dashboard_chat_id")
              .from(Dashboard::Table, Dashboard::ChatId)
              .to(Chat::Table, Chat::Id)
              .on_delete(ForeignKeyAction::Cascade)
              .on_update(ForeignKeyAction::Cascade),
          )
          .foreign_key(
            ForeignKey::create()
              .name("fk_dashboard_message_id")
              .from(Dashboard::Table, Dashboard::MessageId)
              .to(Message::Table, Message::Id)
              .on_delete(ForeignKeyAction::Cascade)
              .on_update(ForeignKeyAction::Cascade),
          )
          .foreign_key(
            ForeignKey::create()
              .name("fk_dashboard_user_id")
              .from(Dashboard::Table, Dashboard::UserId)
              .to(User::Table, User::Id)
              .on_delete(ForeignKeyAction::Cascade)
              .on_update(ForeignKeyAction::Cascade),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(Dashboard::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
pub enum Dashboard {
  Table,
  ChatId,
  MessageId,
  CreatedAt,
  UserId,
  Data,
}
