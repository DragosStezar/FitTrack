using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIsPremiumFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }
    }
}
