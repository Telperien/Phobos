using System.Text.RegularExpressions;

namespace Phobos.Domain;

public enum MediaKind { Image, YouTube }

/// <summary>
/// One piece of exposure material. Levels 1 to 4 show images, level 5 shows a YouTube video.
/// </summary>
public sealed partial class ExposureMedia
{
    public const int VideoLevel = 5;

    public int Level { get; }
    public MediaKind Kind { get; }

    /// <summary>Storage key for an image, YouTube video id for a video.</summary>
    public string Source { get; }

    public int StartSeconds { get; }

    /// <summary>Author and licence of an image; null for a video, which YouTube credits itself.</summary>
    public ImageCredit? Credit { get; }

    private ExposureMedia(int level, MediaKind kind, string source, int startSeconds, ImageCredit? credit)
    {
        Level = level;
        Kind = kind;
        Source = source;
        StartSeconds = startSeconds;
        Credit = credit;
    }

    public static ExposureMedia Image(int level, string storageKey, ImageCredit credit)
    {
        if (level is < 1 or >= VideoLevel) throw new DomainRuleException($"Images belong to levels 1 to 4, not {level}.");
        if (string.IsNullOrWhiteSpace(storageKey)) throw new DomainRuleException("An image needs a storage key.");
        return new ExposureMedia(level, MediaKind.Image, storageKey, 0, credit);
    }

    public static ExposureMedia YouTube(string videoId, int startSeconds = 0)
    {
        if (!YouTubeId().IsMatch(videoId)) throw new DomainRuleException($"'{videoId}' is not a YouTube video id.");
        if (startSeconds < 0) throw new DomainRuleException("A video cannot start before zero.");
        return new ExposureMedia(VideoLevel, MediaKind.YouTube, videoId, startSeconds, credit: null);
    }

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex YouTubeId();
}
