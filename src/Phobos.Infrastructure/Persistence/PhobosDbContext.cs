using Microsoft.EntityFrameworkCore;
using Phobos.Domain;

namespace Phobos.Infrastructure.Persistence;

public sealed class PhobosDbContext(DbContextOptions<PhobosDbContext> options) : DbContext(options)
{
    public DbSet<Phobia> Phobias => Set<Phobia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var phobia = modelBuilder.Entity<Phobia>();
        phobia.HasKey(entity => entity.Id);
        phobia.Property(entity => entity.Id).ValueGeneratedNever();
        phobia.Property(entity => entity.Slug).HasMaxLength(80);
        phobia.HasIndex(entity => entity.Slug).IsUnique();
        phobia.HasIndex(entity => entity.CaseNumber).IsUnique();
        phobia.Property(entity => entity.Category).HasConversion<string>().HasMaxLength(40);

        // Texts and media live in JSON columns: they are always read with their phobia.
        phobia.OwnsMany(entity => entity.Translations, translation =>
        {
            translation.ToJson();
            translation.Property(text => text.Language).HasConversion<string>();
        });
        phobia.OwnsMany(entity => entity.Media, media =>
        {
            media.ToJson();
            media.Property(item => item.Kind).HasConversion<string>();
        });
        phobia.Navigation(entity => entity.Translations).UsePropertyAccessMode(PropertyAccessMode.Field);
        phobia.Navigation(entity => entity.Media).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
