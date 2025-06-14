use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .create_table(
        Table::create()
          .table(AnalyzeOrderProductDetails::Table)
          .if_not_exists()
          .col(pk_uuid(AnalyzeOrderProductDetails::Id).primary_key())
          .col(integer(AnalyzeOrderProductDetails::CustomerCode))
          .col(text(AnalyzeOrderProductDetails::CustormerType))
          .col(text(AnalyzeOrderProductDetails::Province))
          .col(text(AnalyzeOrderProductDetails::City))
          .col(text(AnalyzeOrderProductDetails::CityLevel))
          .col(text(AnalyzeOrderProductDetails::StoreType))
          .col(integer(AnalyzeOrderProductDetails::StoreCode))
          .col(integer(AnalyzeOrderProductDetails::CustromerCode))
          .col(text(AnalyzeOrderProductDetails::BabyAgeGroup))
          .col(text(AnalyzeOrderProductDetails::Gender))
          .col(text(AnalyzeOrderProductDetails::CrowdType))
          .col(text(AnalyzeOrderProductDetails::OnlineOrder))
          .col(text(AnalyzeOrderProductDetails::PaymentDate))
          .col(text_null(AnalyzeOrderProductDetails::WriteOffDate))
          .col(text_null(AnalyzeOrderProductDetails::AssociatedOrderNumber))
          .col(text(AnalyzeOrderProductDetails::FirstCategory))
          .col(text(AnalyzeOrderProductDetails::SecondaryCategory))
          .col(text(AnalyzeOrderProductDetails::RelatedFirstCategory))
          .col(text(AnalyzeOrderProductDetails::RelatedSecondaryCategory))
          .col(text_null(AnalyzeOrderProductDetails::BrandName))
          .col(text_null(AnalyzeOrderProductDetails::RelatedBrandName))
          .col(text(AnalyzeOrderProductDetails::OnlineCommodityCode))
          .col(text_null(
            AnalyzeOrderProductDetails::RelatedOnlineCommodityCode,
          ))
          .col(text(AnalyzeOrderProductDetails::MarketingCampaignType))
          .col(text(AnalyzeOrderProductDetails::SceneName))
          .col(integer_null(
            AnalyzeOrderProductDetails::PaymentWriteOffDaysDifference,
          ))
          .col(decimal(AnalyzeOrderProductDetails::OnlineSales))
          .col(decimal(AnalyzeOrderProductDetails::RelatedSales))
          .to_owned(),
      )
      .await
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .drop_table(
        Table::drop()
          .table(AnalyzeOrderProductDetails::Table)
          .to_owned(),
      )
      .await
  }
}

#[derive(DeriveIden)]
enum AnalyzeOrderProductDetails {
  Table,
  Id,
  CustomerCode,
  CustormerType,
  Province,
  City,
  CityLevel,
  StoreType,
  StoreCode,
  CustromerCode,
  BabyAgeGroup,
  Gender,
  CrowdType,
  OnlineOrder,
  PaymentDate,
  WriteOffDate,
  AssociatedOrderNumber,
  FirstCategory,
  SecondaryCategory,
  RelatedFirstCategory,
  RelatedSecondaryCategory,
  BrandName,
  RelatedBrandName,
  OnlineCommodityCode,
  RelatedOnlineCommodityCode,
  MarketingCampaignType,
  SceneName,
  PaymentWriteOffDaysDifference,
  OnlineSales,
  RelatedSales,
}
