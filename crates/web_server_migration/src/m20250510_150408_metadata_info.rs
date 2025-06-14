use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(MetadataInfo::Table)
          .if_not_exists()
          .col(text(MetadataInfo::ColumnAliases))
          .col(text(MetadataInfo::ColumnType))
          .col(text(MetadataInfo::ColumnDefault).null())
          .col(integer(MetadataInfo::IsNulltable).boolean())
          .col(text(MetadataInfo::TableName))
          .col(text(MetadataInfo::TableAliases))
          .primary_key(
            Index::create()
              .name("metadata_info_column_name_table_name_pk")
              .col(MetadataInfo::ColumnAliases)
              .col(MetadataInfo::TableName),
          )
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(Table::drop().table(MetadataInfo::Table).to_owned())
      .await
  }
}

#[derive(DeriveIden)]
enum MetadataInfo {
  Table,
  ColumnAliases,
  ColumnType,
  ColumnDefault,
  IsNulltable,
  TableName,
  TableAliases,
}
