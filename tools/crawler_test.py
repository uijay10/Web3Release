import os
from crawl4ai import AsyncWebCrawler, LLMExtractionStrategy, LLMConfig
# from prompt import EXTRACTION_SCHEMA, EXTRACTION_PROMPT  # 你的已有 prompt


async def test_crawler():
    # 配置 Groq（推荐用 llama3-70b 或 llama3-8b，速度快、免费额度够用）
    llm_config = LLMConfig(
        provider="groq/llama3-70b-8192",  # 或者 "groq/llama3-8b-8192"（更快更便宜）
        api_token=os.getenv("GROQ_API_KEY"),  # 从 Replit Secrets 读取
        # 如果想更显式，也可以用 "env:GROQ_API_KEY"
    )

    extraction_strategy = LLMExtractionStrategy(
        llm_config=llm_config,  # ← 关键：传入 llm_config
        schema=EXTRACTION_SCHEMA,  # 如果你用了 Pydantic schema
        instruction=EXTRACTION_PROMPT,  # 你的提取指令
        chunk_token_threshold=2000,
        overlap_rate=0.0,
        apply_chunking=True,
        verbose=True,  # 开启日志，便于调试
    )

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url="https://solana.com/",  # 测试用的 Solana 官网
            extraction_strategy=extraction_strategy,
            bypass_cache=True,
        )

        if result.success:
            print("✅ 提取成功！")
            print(result.extracted_content)  # 这里应该输出结构化 JSON/list
        else:
            print("❌ 提取失败:", result.error_message)


# 运行
import asyncio

asyncio.run(test_crawler())
