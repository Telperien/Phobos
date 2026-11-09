namespace Phobos.Domain;

/// <summary>Random draw without repetition: an item comes back only once the whole deck has been seen.</summary>
public static class RouletteDraw
{
    /// <param name="keyOf">Identifies an item among the <paramref name="seen"/> keys.</param>
    /// <param name="nextIndex">Returns an index between 0 (included) and the given count (excluded).</param>
    public static T? Pick<T>(
        IReadOnlyList<T> deck, IReadOnlyCollection<string> seen, Func<T, string> keyOf, Func<int, int> nextIndex)
        where T : class
    {
        var unseen = deck.Where(item => !seen.Contains(keyOf(item))).ToList();
        var pool = unseen.Count > 0 ? unseen : deck;
        return pool.Count == 0 ? null : pool[nextIndex(pool.Count)];
    }
}
