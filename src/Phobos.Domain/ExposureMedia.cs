using System.Text.RegularExpressions;

namespace Phobos.Domain;

public enum MediaKind { Image, YouTube }

/// <summary>
/// One piece of exposure material. Levels 1 and 2 show images, level 3 shows a YouTube video.
/// </summary>
public sealed partial class ExposureMedia
{
    public const int VideoLevel = 3;

    public int Level { get; private set; }
    public MediaKind Kind { get; private set; }

    /// <summary>Storage key for an image, YouTube video id for a video.</summary>
    public string Source { get; private set; }

    public int StartSeconds { get; private set; }

    private ExposureMedia(int level, MediaKind kind, string source, int startSeconds)
    {
        Level = level;
        Kind = kind;
        Source = source;
        StartSeconds = startSeconds;
    }

    public static ExposureMedia Image(int level, string storageKey)
    {
        if (level is not (1 or 2)) throw new DomainRuleException($"Images belong to levels 1 and 2, not {level}.");
        if (string.IsNullOrWhiteSpace(storageKey)) throw new DomainRuleException("An image needs a storage key.");
        return new ExposureMedia(level, MediaKind.Image, storageKey, 0);
    }

    public static ExposureMedia YouTube(string videoId, int startSeconds = 0)
    {
        if (!YouTubeId().IsMatch(videoId)) throw new DomainRuleException($"'{videoId}' is not a YouTube video id.");
        if (startSeconds < 0) throw new DomainRuleException("A video cannot start before zero.");
        return new ExposureMedia(VideoLevel, MediaKind.YouTube, videoId, startSeconds);
    }

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex YouTubeId();
}
