import chainlit as cl


@cl.on_chat_start
async def main():
    options = [
        cl.CheckboxGroupOption(name="townhouse", value="townhouse", label="townhouse"),
        cl.CheckboxGroupOption(name="condo", value="condo", label="condo"),
        cl.CheckboxGroupOption(
            name="single_family", value="single_family", label="single_family"
        ),
        cl.CheckboxGroupOption(
            name="multi_family", value="multi_family", label="multi_family"
        ),
        cl.CheckboxGroupOption(name="land", value="land", label="land"),
        cl.CheckboxGroupOption(name="other", value="other", label="other"),
    ]

    checkbox_group = cl.CheckboxGroup(name="House hunting preferences", options=options)

    res = await cl.AskCheckboxMessage(
        content="Please select the property types you are interested in:",
        checkbox_group=checkbox_group,
    ).send()

    if res:
        print(res["selected"])
        selected_names = [option["name"] for option in res["selected"]]
