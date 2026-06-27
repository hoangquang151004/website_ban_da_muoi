import asyncio
import sys
import json
from app.services.ai_agent.tools.product_db_search import search_products_db
async def main():
    prods, meta = await search_products_db("gợi ý đèn phong thủy")
    print(json.dumps({"meta": meta, "products_count": len(prods)}, indent=2))
    for p in prods:
        print(f" - {p['id']}: {p['name']}")

if __name__ == "__main__":
    asyncio.run(main())
