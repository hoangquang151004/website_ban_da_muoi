import asyncio
import sys
sys.path.append('backend')
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.use import Use, product_uses

async def main():
    engine = create_async_engine('mysql+aiomysql://root:@localhost:3306/da_muoi_db')
    async_session = sessionmaker(engine, class_=AsyncSession)
    import json
    from app.services.ai_agent.tools.product_db_search import parse_product_filters
    spec = await parse_product_filters("gợi ý đèn phong thủy")
    print(spec.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(main())
