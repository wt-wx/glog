import fs from 'fs/promises';

export class RSSFeedGenerator {
  constructor(siteUrl, siteTitle, siteDescription) {
    this.siteUrl = siteUrl;
    this.siteTitle = siteTitle;
    this.siteDescription = siteDescription;
  }

  generateFeed(episodes, options = {}) {
    const {
      podcastTitle = this.siteTitle,
      podcastDescription = this.siteDescription,
      podcastLanguage = options.language || 'zh-cn',
      podcastAuthor = options.author || 'AI Podcast Generator',
      podcastCategory = options.category || 'Technology',
      podcastExplicit = options.explicit || false,
      podcastImage = options.imageUrl,
      managingEditor = options.managingEditor || 'geniux',
      managingEditorEmail = options.managingEditorEmail || '',
      podcastOwnerName = options.ownerName || '',
      podcastOwnerEmail = options.ownerEmail || ''
    };

    const feedItems = episodes.map(episode => this.generateFeedItem(episode));

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${this.escapeXML(podcastTitle)}</title>
    <description>${this.escapeXML(podcastDescription)}</description>
    <language>${podcastLanguage}</language>
    <copyright>Copyright ${new Date().getFullYear()} ${podcastTitle}. All rights reserved.</copyright>
    <managingEditor>${this.escapeXML(managingEditor)}</managingEditor>
    ${managingEditorEmail ? `<managingEditorEmail>${this.escapeXML(managingEditorEmail)}</managingEditorEmail>` : ''}
    <generator>AI Podcast Generator v1.0</generator>
    <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    <image>
      <url>${this.escapeXML(podcastImage)}</url>
      <title>${this.escapeXML(podcastTitle)}</title>
      <link>${this.siteUrl}</link>
    </image>
    <itunes:author>${this.escapeXML(podcastAuthor)}</itunes:author>
    <itunes:owner>
      ${podcastOwnerName ? `<itunes:name>${this.escapeXML(podcastOwnerName)}</itunes:name>` : ''}
      ${podcastOwnerEmail ? `<itunes:email>${this.escapeXML(podcastOwnerEmail)}</itunes:email>` : ''}
    </itunes:owner>
    <itunes:explicit>${podcastExplicit ? 'yes' : 'no'}</itunes:explicit>
    ${podcastCategory ? `<itunes:category text="${this.escapeXML(podcastCategory)}">${podcastCategory}</itunes:category>` : ''}
    <atom:link href="${this.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="${this.siteUrl}/" rel="alternate" type="text/html"/>
    ${feedItems.join('\n    ')}
  </channel>
</rss>`;

    return feed;
  }

  generateFeedItem(episode) {
    const pubDate = new Date(episode.publishedAt).toISOString();
    const durationFormatted = `${Math.floor(episode.duration / 60)}:${episode.duration % 60}`;
    
    return `
    <item>
      <title>${this.escapeXML(episode.title)}</title>
      <description>${this.escapeXML(episode.description)}</description>
      <itunes:author>${this.escapeXML(episode.author)}</itunes:author>
      <itunes:summary>${this.escapeXML(episode.summary)}</itunes:summary>
      <pubDate>${pubDate}</pubDate>
      <enclosure 
        url="${this.escapeXML(episode.audioUrl)}" 
        type="audio/mpeg" 
        length="${episode.fileSize}" 
        duration="${durationFormatted}"
      />
      <itunes:duration>${durationFormatted}</itunes:duration>
      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>
      ${episode.keywords && episode.keywords.length > 0 ? 
        `<itunes:keywords>${this.escapeXML(episode.keywords.join(', '))}</itunes:keywords>` : ''
      }
      <category>${this.escapeXML(episode.category || 'Technology')}</category>
      <guid isPermaLink="false">${this.escapeXML(episode.guid || episode.audioUrl)}</guid>
      ${episode.imageUrl ? 
        `<itunes:image href="${this.escapeXML(episode.imageUrl)}"/>` : ''
      }
    </item>`;
  }

  generateiTunesFeed(episodes, options = {}) {
    const {
      podcastTitle = this.siteTitle,
      podcastDescription = this.siteDescription,
      podcastLanguage = options.language || 'zh-cn',
      podcastAuthor = options.author || 'AI Podcast Generator',
      podcastCategory = options.category || 'Technology',
      podcastExplicit = options.explicit || false,
      podcastImage = options.imageUrl,
      podcastBlock = options.block || false,
      podcastComplete = options.complete || 'yes',
      podcastNewFeedUrl = `${this.siteUrl}/podcast.xml`
    };

    const feedItems = episodes.map(episode => this.generateiTunesFeedItem(episode));

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${this.escapeXML(podcastTitle)}</title>
    <link>${this.siteUrl}</link>
    <description>${this.escapeXML(podcastDescription)}</description>
    <language>${podcastLanguage}</language>
    <copyright>Copyright ${new Date().getFullYear()} ${podcastTitle}. All rights reserved.</copyright>
    <generator>AI Podcast Generator v1.0</generator>
    <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    <itunes:author>${this.escapeXML(podcastAuthor)}</itunes:author>
    <itunes:owner>
      <itunes:name>${this.escapeXML(podcastAuthor)}</itunes:name>
      <itunes:email>${this.escapeXML(options.ownerEmail || '')}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${podcastExplicit ? 'yes' : 'no'}</itunes:explicit>
    ${podcastCategory ? `<itunes:category text="${this.escapeXML(podcastCategory)}">${podcastCategory}</itunes:category>` : ''}
    <itunes:block>${podcastBlock ? 'yes' : 'no'}</itunes:block>
    <itunes:complete>${podcastComplete ? 'yes' : 'no'}</itunes:complete>
    <atom:link href="${podcastNewFeedUrl}" rel="self" type="application/rss+xml"/>
    <atom:link href="${this.siteUrl}/" rel="alternate" type="text/html"/>
    ${feedItems.join('\n    ')}
  </channel>
</rss>`;

    return feed;
  }

  generateiTunesFeedItem(episode) {
    const pubDate = new Date(episode.publishedAt).toISOString();
    const durationFormatted = `${Math.floor(episode.duration / 60)}:${episode.duration % 60}`;
    
    return `
    <item>
      <title>${this.escapeXML(episode.title)}</title>
      <itunes:author>${this.escapeXML(episode.author)}</itunes:author>
      <itunes:subtitle>${this.escapeXML(episode.subtitle || '')}</itunes:subtitle>
      <itunes:summary>${this.escapeXML(episode.description)}</itunes:summary>
      <pubDate>${pubDate}</pubDate>
      <enclosure 
        url="${this.escapeXML(this.siteUrl + episode.audioUrl)}" 
        type="audio/mpeg" 
        length="${episode.fileSize}" 
        duration="${durationFormatted}"
      />
      <itunes:duration>${durationFormatted}</itunes:duration>
      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>
      <guid isPermaLink="false">${this.escapeXML(episode.guid || episode.audioUrl)}</guid>
      ${episode.keywords && episode.keywords.length > 0 ? 
        `<itunes:keywords>${this.escapeXML(episode.keywords.join(', '))}</itunes:keywords>` : ''
      }
      <itunes:episodeType>${episode.type || 'full'}</itunes:episodeType>
      ${episode.imageUrl ? 
        `<itunes:image href="${this.escapeXML(episode.imageUrl)}"/>` : ''
      }
      <itunes:season>${episode.season || ''}</itunes:season>
      <itunes:episode>${episode.number || ''}</itunes:episode>
    </item>`;
  }

  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  saveFeed(feedContent, outputPath) {
    const header = `<?xml version="1.0" encoding="UTF-8"?>`;
    
    return {
      header,
      content: feedContent,
      full: header + '\n' + feedContent
    };
  }
}

export async function generateRSSFeed(episodes, outputPath, options = {}) {
  const generator = new RSSFeedGenerator(
    options.siteUrl || 'https://glog.geniux.net',
    options.siteTitle || 'Geniux Tech Blog Podcast',
    options.siteDescription || 'Technology insights and tutorials from Geniux'
  );
  
  const feedContent = options.iTunesFormat === true
    ? generator.generateiTunesFeed(episodes, options)
    : generator.generateFeed(episodes, options);
  
  const { header, content, full } = generator.saveFeed(feedContent);
  
  await fs.writeFile(outputPath, full, 'utf-8');
  
  console.log(`[RSS Generator] RSS feed 已生成: ${outputPath}`);
  console.log(`[RSS Generator] 包含 ${episodes.length} 个 episodes`);
  
  return {
    success: true,
    outputPath,
    episodeCount: episodes.length,
    feedUrl: `${options.siteUrl || 'https://glog.geniux.net'}/rss.xml`,
    feedSize: Buffer.byteLength(full)
  };
}

export function createFeedGenerator(siteUrl, siteTitle, siteDescription) {
  return new RSSFeedGenerator(siteUrl, siteTitle, siteDescription);
}