using Phobos.Domain;

namespace Phobos.Application.Tests;

public sealed class PhobiaQueriesTests
{
    private readonly InMemoryPhobiaCatalogue _catalogue = new();
    private readonly Queue<int> _randomIndexes = new();
    private readonly List<int> _randomCounts = [];

    private PhobiaQueries Queries => new(_catalogue, new ScriptedRandom(_randomIndexes, _randomCounts));

    private Phobia Add(string slug, int caseNumber, Category category = Category.Animals, bool published = true)
    {
        var phobia = Phobia.Create(slug, caseNumber, category,
        [
            new(Language.Fr, $"{slug} (fr)", "étymologie", "résumé", "description", "annotation"),
            new(Language.En, $"{slug} (en)", "etymology", "summary", "description (en)", "annotation (en)"),
        ]);
        if (published) phobia.Publish();
        _catalogue.Phobias.Add(phobia);
        return phobia;
    }

    [Fact]
    public async Task List_returns_published_phobias_by_case_number_in_the_requested_language()
    {
        Add("thalassophobia", 6);
        Add("arachnophobia", 1);
        Add("draft-phobia", 2, published: false);

        var list = await Queries.ListAsync(Language.Fr, category: null, CancellationToken.None);

        Assert.Equal(
            [
                new PhobiaSummary("arachnophobia", 1, "animals", "fr", "arachnophobia (fr)", "étymologie", "résumé"),
                new PhobiaSummary("thalassophobia", 6, "animals", "fr", "thalassophobia (fr)", "étymologie", "résumé"),
            ],
            list);
    }

    [Fact]
    public async Task List_can_be_narrowed_to_one_category()
    {
        Add("arachnophobia", 1, Category.Animals);
        Add("acrophobia", 14, Category.NatureAndSpaces);

        var list = await Queries.ListAsync(Language.En, Category.NatureAndSpaces, CancellationToken.None);

        Assert.Equal(["acrophobia"], list.Select(summary => summary.Slug));
    }

    [Fact]
    public async Task List_reports_the_language_actually_served()
    {
        Add("arachnophobia", 1);

        var list = await Queries.ListAsync(Language.It, category: null, CancellationToken.None);

        Assert.Equal(("en", "arachnophobia (en)"), (list[0].Language, list[0].Name));
    }

    [Fact]
    public async Task Get_returns_the_case_file_with_its_five_levels()
    {
        var phobia = Add("arachnophobia", 1);
        phobia.AddMedia(ExposureMedia.Image(2, "arachnophobia/2-a.webp", ImageCredit.Generated));
        phobia.AddMedia(ExposureMedia.YouTube("dQw4w9WgXcQ", startSeconds: 12));
        phobia.AddMedia(ExposureMedia.Image(1, "arachnophobia/1-a.webp", ImageCredit.Generated));

        var detail = await Queries.GetAsync(Language.En, "arachnophobia", CancellationToken.None);

        Assert.NotNull(detail);
        Assert.Equal(("arachnophobia", 1, "animals", "en"), (detail.Slug, detail.CaseNumber, detail.Category, detail.Language));
        Assert.Equal(("arachnophobia (en)", "etymology", "summary"), (detail.Name, detail.Etymology, detail.Summary));
        Assert.Equal(("description (en)", "annotation (en)"), (detail.Description, detail.Annotation));
        Assert.Equal(
            [
                new ExposureLevelView(1, [new MediaView("image", "/media/arachnophobia/1-a.webp", 0)]),
                new ExposureLevelView(2, [new MediaView("image", "/media/arachnophobia/2-a.webp", 0)]),
                new ExposureLevelView(3, []),
                new ExposureLevelView(4, []),
                new ExposureLevelView(5, [new MediaView("youtube", "dQw4w9WgXcQ", 12)]),
            ],
            detail.Levels,
            new LevelComparer());
    }

    [Fact]
    public async Task Get_credits_the_images_found_on_the_web_and_only_them()
    {
        var phobia = Add("arachnophobia", 1);
        phobia.AddMedia(ExposureMedia.Image(3, "arachnophobia/3-a.webp", ImageCredit.Generated));
        phobia.AddMedia(ExposureMedia.Image(3, "arachnophobia/3-b.webp",
            ImageCredit.Licensed("CC BY 4.0", new Uri("https://commons.wikimedia.org/wiki/File:Spider.jpg"), "Jean Dupont")));

        var detail = await Queries.GetAsync(Language.Fr, "arachnophobia", CancellationToken.None);

        Assert.Equal(
            [
                new MediaView("image", "/media/arachnophobia/3-a.webp", 0),
                new MediaView("image", "/media/arachnophobia/3-b.webp", 0,
                    new MediaCredit("Jean Dupont", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Spider.jpg")),
            ],
            detail!.Levels[2].Media);
    }

    [Fact]
    public async Task Get_keeps_empty_levels_so_the_journey_always_has_five_steps()
    {
        Add("arachnophobia", 1);

        var detail = await Queries.GetAsync(Language.Fr, "arachnophobia", CancellationToken.None);

        Assert.Equal([1, 2, 3, 4, 5], detail!.Levels.Select(level => level.Number));
        Assert.All(detail.Levels, level => Assert.Empty(level.Media));
    }

    [Fact]
    public async Task Get_hides_unknown_and_unpublished_phobias()
    {
        Add("draft-phobia", 2, published: false);

        Assert.Null(await Queries.GetAsync(Language.Fr, "draft-phobia", CancellationToken.None));
        Assert.Null(await Queries.GetAsync(Language.Fr, "unknown", CancellationToken.None));
    }

    [Fact]
    public async Task Draw_picks_a_published_phobia_not_seen_yet()
    {
        Add("arachnophobia", 1);
        Add("draft-phobia", 2, published: false);
        Add("acrophobia", 14);
        Add("coulrophobia", 27);
        _randomIndexes.Enqueue(1);

        var drawn = await Queries.DrawAsync(Language.Fr, seen: ["acrophobia"], exclude: [], CancellationToken.None);

        Assert.Equal("coulrophobia", drawn?.Slug);
        Assert.Equal([2], _randomCounts);
    }

    [Fact]
    public async Task Draw_returns_nothing_when_no_phobia_is_published()
    {
        Add("draft-phobia", 2, published: false);

        Assert.Null(await Queries.DrawAsync(Language.Fr, seen: [], exclude: [], CancellationToken.None));
    }

    [Fact]
    public async Task Draw_leaves_out_excluded_phobias()
    {
        Add("arachnophobia", 1);
        Add("acrophobia", 14);
        Add("coulrophobia", 27);
        _randomIndexes.Enqueue(1);

        var drawn = await Queries.DrawAsync(
            Language.Fr, seen: [], exclude: ["arachnophobia"], CancellationToken.None);

        Assert.Equal("coulrophobia", drawn?.Slug);
        Assert.Equal([2], _randomCounts);
    }

    [Fact]
    public async Task Draw_returns_nothing_once_every_phobia_is_excluded()
    {
        Add("arachnophobia", 1);
        Add("acrophobia", 14);

        Assert.Null(await Queries.DrawAsync(
            Language.Fr, seen: [], exclude: ["acrophobia", "arachnophobia"], CancellationToken.None));
    }

    [Fact]
    public async Task Thirty_draws_show_thirty_different_phobias_then_a_new_round_starts_with_another_one()
    {
        for (var caseNumber = 1; caseNumber <= 30; caseNumber++) Add($"phobia-{caseNumber}", caseNumber);
        var queries = new PhobiaQueries(_catalogue, new SteppingRandom());
        var seen = new List<string>();

        for (var draw = 0; draw < 30; draw++)
        {
            var drawn = await queries.DrawAsync(Language.Fr, seen, exclude: [], CancellationToken.None);
            seen.Add(drawn!.Slug);
        }
        var firstOfNextRound = await queries.DrawAsync(Language.Fr, seen, exclude: [], CancellationToken.None);

        Assert.Equal(30, seen.Distinct().Count());
        Assert.NotNull(firstOfNextRound);
        Assert.NotEqual(seen[^1], firstOfNextRound.Slug);
    }

    /// <summary>Deterministic but spread out: always returns the last index of the pool.</summary>
    private sealed class SteppingRandom : IRandomIndex
    {
        public int IndexBelow(int count) => count - 1;
    }

    private sealed class InMemoryPhobiaCatalogue : IPhobiaCatalogue
    {
        public List<Phobia> Phobias { get; } = [];

        public Task<IReadOnlyList<Phobia>> ListAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Phobia>>(Phobias);

        public Task<Phobia?> FindBySlugAsync(string slug, CancellationToken cancellationToken) =>
            Task.FromResult(Phobias.Find(phobia => phobia.Slug == slug));
    }

    private sealed class ScriptedRandom(Queue<int> indexes, List<int> counts) : IRandomIndex
    {
        public int IndexBelow(int count)
        {
            counts.Add(count);
            return indexes.Dequeue();
        }
    }

    private sealed class LevelComparer : IEqualityComparer<ExposureLevelView>
    {
        public bool Equals(ExposureLevelView? x, ExposureLevelView? y) =>
            x?.Number == y?.Number && x!.Media.SequenceEqual(y!.Media);

        public int GetHashCode(ExposureLevelView obj) => obj.Number;
    }
}
