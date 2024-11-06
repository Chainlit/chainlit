import pandas as pd

import chainlit as cl


@cl.on_chat_start
async def start():
    # Create a sample DataFrame with more than 10 rows to test pagination functionality
    data = {
        "Name": [
            "Alice",
            "David",
            "Charlie",
            "Bob",
            "Eva",
            "Grace",
            "Hannah",
            "Jack",
            "Frank",
            "Kara",
            "Liam",
            "Ivy",
            "Mia",
            "Noah",
            "Olivia",
        ],
        "Age": [25, 40, 35, 30, 45, 55, 60, 70, 50, 75, 80, 65, 85, 90, 95],
        "City": [
            "New York",
            "Houston",
            "Chicago",
            "Los Angeles",
            "Phoenix",
            "San Antonio",
            "San Diego",
            "San Jose",
            "Philadelphia",
            "Austin",
            "Fort Worth",
            "Dallas",
            "Jacksonville",
            "Columbus",
            "Charlotte",
        ],
        "Salary": [
            70000,
            100000,
            90000,
            80000,
            110000,
            130000,
            140000,
            160000,
            120000,
            170000,
            180000,
            150000,
            190000,
            200000,
            210000,
        ],
    }

    df = pd.DataFrame(data)

    elements = [cl.Dataframe(data=df, display="inline", name="Dataframe")]

    await cl.Message(content="This message has a Dataframe", elements=elements).send()
