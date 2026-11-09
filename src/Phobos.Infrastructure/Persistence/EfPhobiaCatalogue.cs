using Microsoft.EntityFrameworkCore;
using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Infrastructure.Persistence;

public sealed class EfPhobiaCatalogue(PhobosDbContext db) : IPhobiaCatalogue
{
    public async Task<IReadOnlyList<Phobia>> ListAsync(CancellationToken cancellationToken) =>
        await db.Phobias.AsNoTracking().ToListAsync(cancellationToken);

    public Task<Phobia?> FindBySlugAsync(string slug, CancellationToken cancellationToken) =>
        db.Phobias.AsNoTracking().FirstOrDefaultAsync(phobia => phobia.Slug == slug, cancellationToken);
}
