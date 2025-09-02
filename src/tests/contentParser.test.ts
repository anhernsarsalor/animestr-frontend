import { expect, test, describe } from 'vitest'

import { parseMarkdown } from '../lib/parseMarkdown';

describe('Markdown parsing', () => {
  describe('Basic parsing', () => {
    test('Should parse plain text', async () => {
      let parsed = await parseMarkdown('plain text');
      expect(parsed).toMatchObject({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'plain text'
          }]
        }]
      })
    });

    test('Should parse bold, underline, italic and strikethrough', async () => {
      let parsed = await parseMarkdown('**bold** *italic* __underline__ ~strikethrough~');
      expect(parsed).toEqual(
        {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "strong",
                  children: [
                    {
                      type: "text",
                      value: "bold",
                    },
                  ],
                },
                {
                  type: "text",
                  value: " ",
                },
                {
                  type: "emphasis",
                  children: [
                    {
                      type: "text",
                      value: "italic",
                    },
                  ],
                },
                {
                  type: "text",
                  value: " ",
                },
                {
                  type: "underlined",
                  children: [
                    {
                      type: "text",
                      value: "underline",
                    },
                  ],
                },
                {
                  type: "text",
                  value: " ",
                },
                {
                  type: "delete",
                  children: [
                    {
                      type: "text",
                      value: "strikethrough",
                    },
                  ],
                },
              ],
            },
          ],
        }
      )
    })

    test('should parse headings', async () => {
      let parsed = await parseMarkdown('# heading');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'heading',
          depth: 1,
          children: [{
            type: 'text',
            value: 'heading'
          }]
        }]
      })
      parsed = await parseMarkdown('## h2');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'heading',
          depth: 2,
          children: [{
            type: 'text',
            value: 'h2'
          }]
        }]
      })
      parsed = await parseMarkdown('### h3');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'heading',
          depth: 3,
          children: [{
            type: 'text',
            value: 'h3'
          }]
        }]
      })
      parsed = await parseMarkdown('#### h4');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'heading',
          depth: 4,
          children: [{
            type: 'text',
            value: 'h4'
          }]
        }]
      })
    });

    test('should parse nested markdown', async () => {
      let parsed = await parseMarkdown('**bold with *italic* text inside as well as __underlined *italic*__**')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'strong',
            children: [{
              type: 'text',
              value: 'bold with '
            }, {
              type: 'emphasis',
              children: [{
                type: 'text',
                value: 'italic'
              }]
            }, {
              type: 'text',
              value: " text inside as well as "
            }, {
              type: 'underlined',
              children: [{
                type: 'text',
                value: 'underlined '
              }, {
                type: 'emphasis',
                children: [{
                  type: 'text',
                  value: 'italic'
                }]
              }]
            }]
          }]
        }]
      })
    })
    test('should gracefully handle invalid markdown', async () => {
      let parsed = await parseMarkdown('*this is not closed _hence is not ~parsed');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: '*this is not closed _hence is not ~parsed'
          }]
        }]
      })
    })
  })

  describe('Links parsing', () => {
    test('should handle http links', async () => {
      let parsed = await parseMarkdown('http://example.com');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'http://example.com',
            title: null,
            children: [{
              type: 'text',
              value: 'http://example.com'
            }]
          }]
        }]
      })
    })

    test('should handle https links', async () => {
      let parsed = await parseMarkdown('https://example.com');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'https://example.com',
            title: null,
            children: [{
              type: 'text',
              value: 'https://example.com'
            }]
          }]
        }]
      })
    })

    test('should handle named links', async () => {
      let parsed = await parseMarkdown('[example](https://example.com)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'https://example.com',
            title: null,
            children: [{
              type: 'text',
              value: 'example'
            }]
          }]
        }]
      })
    })

    test('should handle complex links', async () => {
      let parsed = await parseMarkdown('[example](https://user:password@example.com/?q=t%20e%20s%20t+something&foo=bar;baz=bar#fragment)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'https://user:password@example.com/?q=t%20e%20s%20t+something&foo=bar;baz=bar#fragment',
            title: null,
            children: [{
              type: 'text',
              value: 'example'
            }]
          }]
        }]
      })
    })

    test('should handle buffalo buffalo links', async () => {
      let parsed = await parseMarkdown('https://https:⁄⁄example.com@https://example.com/https:⁄⁄example.com⁄?https://example.com=https://example.com;https://example.com#https://example.com');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'https://https:⁄⁄example.com@https://example.com/https:⁄⁄example.com⁄?https://example.com=https://example.com;https://example.com#https://example.com',
            title: null,
            children: [{
              type: 'text',
              value: 'https://https:⁄⁄example.com@https://example.com/https:⁄⁄example.com⁄?https://example.com=https://example.com;https://example.com#https://example.com'
            }]
          }]
        }]
      })
    })

    test('should handle links with markdown names', async () => {
      let parsed = await parseMarkdown('[*italic* __underscore__](https://example.com)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            url: 'https://example.com',
            title: null,
            children: [{
              type: 'emphasis',
              children: [{
                type: 'text',
                value: 'italic'
              }]
            }, {
              type: 'text',
              value: ' '
            }, {
              type: 'underlined',
              children: [{
                type: 'text',
                value: 'underscore'
              }]
            }]
          }]
        }]
      })
    })
  });

  describe('Image Related', () => {
    test('should handle image urls', async () => {
      let parsed = await parseMarkdown('https://example.com/image.jpg')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'link',
            title: null,
            url: 'https://example.com/image.jpg',
            children: [{
              type: 'image',
              alt: '',
              title: null,
              url: 'https://example.com/image.jpg'
            }]
          }]
        }]
      })
    })

    test('should handle images markdown', async () => {
      let parsed = await parseMarkdown('![alt text](https://example.com/image.jpg)')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'image',
            url: 'https://example.com/image.jpg',
            alt: 'alt text',
            title: null,
          }]
        }]
      })
    })

    test('should handle images with size', async () => {
      let parsed = await parseMarkdown('the following is an image of size 500 img500(https://example.com/image.jpg) and this is text after');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'the following is an image of size 500 ',
          }, {
            type: 'image',
            url: 'https://example.com/image.jpg',
            alt: '',
            title: null,
            size: '500px'
          }, {
            type: 'text',
            value: ' and this is text after'
          }]
        }]
      })
    })

    test('should handle images with percent size', async () => {
      let parsed = await parseMarkdown('the following is an image of size 50% img50%(https://example.com/image.jpg) and this is text after');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'the following is an image of size 50% ',
          }, {
            type: 'image',
            url: 'https://example.com/image.jpg',
            alt: '',
            title: null,
            size: '50%'
          }, {
            type: 'text',
            value: ' and this is text after'
          }]
        }]
      })
    })

    test('should handle sized images without text after', async () => {
      let parsed = await parseMarkdown('the following is an image of size 50% img50%(https://example.com/image.jpg)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'the following is an image of size 50% ',
          }, {
            type: 'image',
            url: 'https://example.com/image.jpg',
            alt: '',
            title: null,
            size: '50%'
          }]
        }]
      })
    })

    test('should handle sized images without text before or after', async () => {
      let parsed = await parseMarkdown('img50%(https://example.com/image.jpg)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'image',
            url: 'https://example.com/image.jpg',
            alt: '',
            title: null,
            size: '50%'
          }]
        }]
      })
    })
  })

  describe('Nostr related', () => {
    test('should parse hashtags', async () => {
      const parsed = await parseMarkdown('Love #bitcoin and ﹟nostr');
      expect(parsed).toEqual(
        {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value: "Love ",
                },
                {
                  tag: "bitcoin",
                  type: "hashtag",
                  children: [
                    {
                      type: "text",
                      value: "#bitcoin",
                    },
                  ],
                },
                {
                  type: "text",
                  value: " and ",
                },
                {
                  tag: "nostr",
                  type: "hashtag",
                  children: [
                    {
                      "type": "text",
                      "value": "﹟nostr",
                    },
                  ],
                },
              ],
            },
          ],
        }
      )
    });

    test('should parse nostr: mentions', async () => {
      const parsed = await parseMarkdown('Follow nostr:npub1wnanaunumzv96ll0cm5569uzjqn474yj24a559n2h8x3gk9d40rsjxl20f');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'Follow'
          }, {
            type: 'npub',
            id: '74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7'
          }]
        }]
      })
    })

    test('should parse mentions without nostr:', async () => {
      const parsed = await parseMarkdown('Follow npub1wnanaunumzv96ll0cm5569uzjqn474yj24a559n2h8x3gk9d40rsjxl20f');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'Follow'
          }, {
            type: 'npub',
            id: '74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7'
          }]
        }]
      })
    })

    test('should parse nprofile mentions:', async () => {
      const parsed = await parseMarkdown('Follow nprofile1qy2hwumn8ghj7mn0wd68yt33wdshgtn0wfnj7qguwaehxw309ahx7um5wfjkccte9euk2emgwfhjuumfw3jj7qpql4vcnh06mk0z4akwhzmrjs4fuvdnwdn73xghjv0duwew5a5z8ugq4tes5d');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'Follow'
          }, {
            type: 'npub',
            id: 'fd5989ddfadd9e2af6ceb8b63942a9e31b37367e89917931ede3b2ea76823f10'
          }]
        }]
      })
    })

    test('should parse note1', async () => {
      const parsed = await parseMarkdown('note1nlxnf7n6uz5gujk43ha36sr8rjp69wszkvppnn49arxg7dzydzxsuwpjk8')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            id: '9fcd34fa7ae0a88e4ad58dfb1d40671c83a2ba02b30219cea5e8cc8f3444688d',
            type: 'event'
          }]
        }]
      });
    });

    test('should parse nevent1', async () => {
      const parsed = await parseMarkdown('nostr:nevent1qvzqqqqqqypzqa8m8me8ekyct4l7l3hff5tc9yp8ta2fy4tmfgtx4wwdz3v2m278qyf8wumn8ghj7u3wddhk56tjvyhxjme0qythwumn8ghj7ctwd9kk2tnwdaehgu339e3k7mf0qqsflnf5lfawp2ywft2cm7cagpn3eqazhgptxqsee6j73ny0x3zx3rgks933l')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            id: '9fcd34fa7ae0a88e4ad58dfb1d40671c83a2ba02b30219cea5e8cc8f3444688d',
            type: 'event'
          }]
        }]
      })
    })

    test('links to njump.me should be handled as mentions or events', async () => {
      let parsed = await parseMarkdown('https://njump.me/npub1wnanaunumzv96ll0cm5569uzjqn474yj24a559n2h8x3gk9d40rsjxl20f');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'npub',
            id: '74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7'
          }]
        }]
      })
      parsed = await parseMarkdown('https://njump.me/nevent1qqsxhfvdm6fhz7e8hf4xtpaw8f0r642fcnmv96qwu944fxa47yv8ngqzypttx9g5jyp8eschljcrawfmlshv2gv6tkxqqzf8397yyr39vh932nrdkg5')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            id: '6ba58dde93717b27ba6a6587ae3a5e3d5549c4f6c2e80ee16b549bb5f11879a0',
            type: 'event'
          }]
        }]
      })
    })
  })

  describe('Anime related', () => {
    test('should parse anilist links to animestr anime', async () => {
      let parsed = await parseMarkdown('https://anilist.co/anime/171110/Honzuki-no-Gekokujou-Ryoushu-no-Youjo/');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'anime',
            id: '171110',
            source: 'anilist'
          }]
        }]
      })
    });

    test('should parse anime(place:id) reference', async () => {
      let parsed = await parseMarkdown('anime(anilist:171110)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'anime',
            id: '171110',
            source: 'anilist'
          }]
        }]
      })
    })

    test('should parse anilist(id) reference', async () => {
      let parsed = await parseMarkdown('anilist(171110)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'anime',
            id: '171110',
            source: 'anilist'
          }]
        }]
      })
    })

    test('should parse mal(id) reference', async () => {
      let parsed = await parseMarkdown('mal(57466)');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'anime',
            id: '57466',
            source: 'mal'
          }]
        }]
      })
    })

    test('should handle plaintext animestr as text', async () => {
      let parsed = await parseMarkdown('animestr');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'animestr'
          }]
        }]
      })
    })

    test('should parse animestr logo on url', async () => {
      let parsed = await parseMarkdown('https://animestr.xyz/');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'animestr-logo',
            link: '/'
          }]
        }]
      })
    })
  })

  describe('cashu', () => {
    test('should parse cashu tokens', async () => {
      let parsed = await parseMarkdown('cashuBo2FtcWh0dHBzOi8vMjFtaW50Lm1lYXVjc2F0YXSBomFpSAAyv8nc6R3uYXCBpGFhAWFzeEA4ODNiZTUwMDc2ZjIyOGFmZjg0OTZjNDE1NTFlZDk3ZWQ5YjAyMTQ2YWUxMzk3ZDRiNzZkOGM4YWZjZjc0M2NkYWNYIQKZdDN4jOSkXTxQZDHKeHEUMX9TMw_7dLB0UNkdX0bWwmFko2FlWCB0_NGL4OZ-_Qe2ClhGx1O7y8PD8gJ_oV_KtClBhdQqT2FzWCBmfReclbDPpwTb_bIKXBSTlw0-F-qxiSncs_UwnsjwFGFyWCBUATMbVcvWAdQdnkWgVop-N98NKF0Pyi7fAOszksVrlw');
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'cashuToken',
            value: 'cashuBo2FtcWh0dHBzOi8vMjFtaW50Lm1lYXVjc2F0YXSBomFpSAAyv8nc6R3uYXCBpGFhAWFzeEA4ODNiZTUwMDc2ZjIyOGFmZjg0OTZjNDE1NTFlZDk3ZWQ5YjAyMTQ2YWUxMzk3ZDRiNzZkOGM4YWZjZjc0M2NkYWNYIQKZdDN4jOSkXTxQZDHKeHEUMX9TMw_7dLB0UNkdX0bWwmFko2FlWCB0_NGL4OZ-_Qe2ClhGx1O7y8PD8gJ_oV_KtClBhdQqT2FzWCBmfReclbDPpwTb_bIKXBSTlw0-F-qxiSncs_UwnsjwFGFyWCBUATMbVcvWAdQdnkWgVop-N98NKF0Pyi7fAOszksVrlw'
          }]
        }]
      })
    })
  })

  describe('general', () => {
    test('parse youtube link', async () => {
      let parsed = await parseMarkdown('https://www.youtube.com/watch?v=9wnNW4HyDtg')
      expect(parsed).toEqual({
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "youtube",
                videoId: "9wnNW4HyDtg",
              },
            ],
          },
        ],
      })
    })
    test('parse named emoji', async () => {
      let parsed = await parseMarkdown('before :emoji: after')
      expect(parsed).toEqual({
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'before'
          }, {
            type: 'emoji',
            emoji: 'emoji'
          }, {
            type: 'text',
            value: ' after'
          }]
        }]
      })
    })
  })

  test('should parse ruby', async () => {
    let parsed = await parseMarkdown('{[地][獄]}^([じ][ごく])')
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "ruby",
              children: [
                {
                  type: "rb",
                  value: "地",
                },
                {
                  type: "rb",
                  value: "獄",
                },
                {
                  type: "rt",
                  value: "じ",
                },
                {
                  type: "rt",
                  value: "ごく",
                },
              ],
            },
          ],
        },
      ],
    })
  })
})

