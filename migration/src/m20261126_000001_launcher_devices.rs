use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(LauncherDevice::Table)
                    .col(
                        ColumnDef::new(LauncherDevice::Code)
                            .string_len(32)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(LauncherDevice::SecretHash)
                            .string_len(64)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(LauncherDevice::ClientToken)
                            .string_len(80)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(LauncherDevice::Expires)
                            .big_integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(LauncherDevice::UserId).big_integer().null())
                    .col(
                        ColumnDef::new(LauncherDevice::Profile)
                            .string_len(32)
                            .null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(LauncherDevice::Table).to_owned())
            .await
    }
}
#[derive(DeriveIden)]
enum LauncherDevice {
    Table,
    Code,
    SecretHash,
    ClientToken,
    Expires,
    UserId,
    Profile,
}
