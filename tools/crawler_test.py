# crawler_test.py
# Web3 Release AI 抓取 + 真实 LLM 调用测试

from prompt import WEB3_EXTRACTION_PROMPT
import json
import asyncio
import sys
import os
import requests
from bs4 import BeautifulSoup


def fetch_with_requests(url: str) -> str:
    """使用 requests + BeautifulSoup 抓取静态页面"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return text[:15000]
    except Exception as e:
        return f"抓取失败: {str(e)}"


async def fetch_with_crawl4ai(url: str) -> str:
    """尝试使用 Crawl4AI（JS渲染），失败则回退到 requests"""
    try:
        from crawl4ai import AsyncWebCrawler
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=url)
            content = result.markdown or result.cleaned_html or ""
            if content and len(content) > 200:
                return content[:15000]
    except Exception as e:
        print(f"⚠️  Crawl4AI 不可用: {type(e).__name__}，切换到 requests 模式")
    return fetch_with_requests(url)


def extract_with_groq(page_text: str, url: str):
    """使用 Groq LLM 真实提取"""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        full_prompt = WEB3_EXTRACTION_PROMPT.replace(
            "{{PAGE_CONTENT}}", f"URL: {url}\n\n{page_text}"
        )
        print("🔑 GROQ_API_KEY 已设置，正在调用真实 LLM...")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.1,
            max_tokens=4000,
        )
        raw = response.choices[0].message.content.strip()
        # 清理可能的 markdown 代码块
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"❌ Groq 调用失败: {e}")
        return None


async def main():
    print("=== Web3 Release AI 抓取 + LLM 提取测试 ===\n")

    # 支持命令行参数，无参数则使用默认值
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = "https://solana.com"

    print(f"🌐 目标 URL: {url}")
    print("📡 正在抓取网页内容...\n")

    page_text = await fetch_with_crawl4ai(url)
    print(f"✅ 抓取完成，内容长度: {len(page_text)} 字符")
    print(f"📄 内容预览（前200字）:\n{page_text[:200]}\n{'─'*50}\n")

    print("🤖 正在提取事件...")
    events = extract_with_groq(page_text, url)

    if events is None:
        print("💡 未设置 GROQ_API_KEY，使用模拟输出")
        events = [
            {
                "title": "示例：从真实网页抓取后提取的事件",
                "project_name": "示例项目",
                "description": f"已成功从 {url} 抓取 {len(page_text)} 字符内容。设置 GROQ_API_KEY 后将使用真实 AI 分析。",
                "category": ["测试网"],
                "start_time": None,
                "end_time": None,
                "source_url": url,
                "importance": "medium",
                "ai_confidence": 0.0,
                "tags": ["Web3"],
            }
        ]

    print("\n📋 提取结果：")
    print(json.dumps(events, ensure_ascii=False, indent=2))

    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"\n💾 结果已保存到 extraction_result.json")
    print("🎉 测试完成！")

    if not os.environ.get("GROQ_API_KEY"):
        print("\n💡 提示：在 Secrets 中设置 GROQ_API_KEY 即可启用真实 AI 提取")


if __name__ == "__main__":
    asyncio.run(main())
