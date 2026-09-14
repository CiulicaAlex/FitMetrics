using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fit_Metrics.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPhysicalStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Height",
                table: "Users",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Weight",
                table: "Users",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Height",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Users");
        }
    }
}
