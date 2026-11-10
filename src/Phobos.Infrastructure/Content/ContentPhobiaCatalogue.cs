using Phobos.Application;
using Phobos.Domain;

namespace Phobos.Infrastructure.Content;

/// <summary>The catalogue held in memory, as loaded from the content files at startup.</summary>
public sealed class ContentPhobiaCatalogue(IReadOnlyList<Phobia> phobias) : IPhobiaCatalogue
{
    public Task<IReadOnlyList<Phobia>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(phobias);

    public Task<Phobia?> FindBySlugAsync(string slug, CancellationToken cancellationToken) =>
        Task.FromResult(phobias.FirstOrDefault(phobia => phobia.Slug == slug));
}
