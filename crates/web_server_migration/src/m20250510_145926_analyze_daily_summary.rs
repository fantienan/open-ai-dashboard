use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(AnalyzeDailyummary::Table)
          .if_not_exists()
          .col(pk_uuid(AnalyzeDailyummary::Id).primary_key())
          .col(integer(AnalyzeDailyummary::CustomerCode))
          .col(integer(AnalyzeDailyummary::MemberCode))
          .col(text(AnalyzeDailyummary::VisitDate))
          .col(integer(AnalyzeDailyummary::VisitTimePeriod))
          .col(integer(AnalyzeDailyummary::WeixinId))
          .col(integer(AnalyzeDailyummary::Pv))
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(AnalyzeDailyummary::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
enum AnalyzeDailyummary {
  Table,
  Id,
  CustomerCode,
  MemberCode,
  VisitDate,
  VisitTimePeriod,
  WeixinId,
  Pv,
}
