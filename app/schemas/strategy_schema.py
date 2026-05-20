from pydantic import BaseModel, ConfigDict


class StrategySelectionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    strategy: str
