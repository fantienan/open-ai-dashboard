pub use sea_orm_migration::prelude::*;
mod m20220101_000001_create_table;
mod m20250426_093200_chat;
mod m20250426_102845_message;
mod m20250426_112536_user;
mod m20250426_113943_vote;
mod m20250510_145926_analyze_daily_summary;
mod m20250510_150218_analyze_order_product_details;
mod m20250510_150408_metadata_info;
mod m20250510_150422_dashboard;
mod m20250517_142627_email_code;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
  fn migrations() -> Vec<Box<dyn MigrationTrait>> {
    vec![
      Box::new(m20220101_000001_create_table::Migration),
      Box::new(m20250426_093200_chat::Migration),
      Box::new(m20250426_102845_message::Migration),
      Box::new(m20250426_112536_user::Migration),
      Box::new(m20250426_113943_vote::Migration),
      Box::new(m20250510_145926_analyze_daily_summary::Migration),
      Box::new(m20250510_150218_analyze_order_product_details::Migration),
      Box::new(m20250510_150408_metadata_info::Migration),
      Box::new(m20250510_150422_dashboard::Migration),
      Box::new(m20250517_142627_email_code::Migration),
    ]
  }
}
