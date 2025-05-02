using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserProfileForTargetWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Goal",
                table: "UserProfiles");

            migrationBuilder.AddColumn<double>(
                name: "TargetWeightKg",
                table: "UserProfiles",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetWeightKg",
                table: "UserProfiles");

            migrationBuilder.AddColumn<int>(
                name: "Goal",
                table: "UserProfiles",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }
    }
}
