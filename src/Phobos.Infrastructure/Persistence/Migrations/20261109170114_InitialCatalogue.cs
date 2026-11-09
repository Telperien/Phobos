using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Phobos.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCatalogue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "phobias",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    case_number = table.Column<int>(type: "integer", nullable: false),
                    category = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    media = table.Column<string>(type: "jsonb", nullable: true),
                    translations = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_phobias", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_phobias_case_number",
                table: "phobias",
                column: "case_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_phobias_slug",
                table: "phobias",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "phobias");
        }
    }
}
