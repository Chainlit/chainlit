COMPOSER_WIDGETS_CONFIG = [
    {
        "name": "model_selection_dropdown",
        "display": "inline",
        "type": "custom",  # Added type as per instructions
        "props": {
            "widgetType": "dropdown",
            "label": "Select Model",
            "id": "model_dropdown_widget", # HTML ID for the element
            "options": [
                { "value": "gpt-4", "label": "GPT-4" },
                { "value": "claude-2", "label": "Claude 2" },
            ],
            "initialValue": "gpt-4",
        }
    }
]
