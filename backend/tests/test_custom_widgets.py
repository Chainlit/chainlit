import unittest
from chainlit.custom_widgets import COMPOSER_WIDGETS_CONFIG

class TestCustomWidgets(unittest.TestCase):
    def test_composer_widgets_config_structure(self):
        self.assertIsInstance(COMPOSER_WIDGETS_CONFIG, list, "COMPOSER_WIDGETS_CONFIG should be a list")
        
        if not COMPOSER_WIDGETS_CONFIG:
            # If it's empty, it's technically valid but maybe not intended for production.
            # For this test, we'll assume it can be empty or populated.
            # If it must be non-empty, add self.assertTrue(COMPOSER_WIDGETS_CONFIG)
            return

        for widget_config in COMPOSER_WIDGETS_CONFIG:
            self.assertIsInstance(widget_config, dict, "Each widget config should be a dictionary")
            
            self.assertIn("name", widget_config, "Widget config must have a 'name'")
            self.assertIsInstance(widget_config["name"], str, "'name' must be a string")

            self.assertIn("display", widget_config, "Widget config must have a 'display'")
            self.assertIsInstance(widget_config["display"], str, "'display' must be a string") # Assuming 'inline', 'side', 'page' etc.

            self.assertIn("type", widget_config, "Widget config must have a 'type'")
            self.assertEqual(widget_config["type"], "custom", "'type' must be 'custom'")

            self.assertIn("props", widget_config, "Widget config must have 'props'")
            self.assertIsInstance(widget_config["props"], dict, "'props' must be a dictionary")

            props = widget_config["props"]
            self.assertIn("widgetType", props, "Props must have 'widgetType'")
            self.assertIsInstance(props["widgetType"], str, "'widgetType' must be a string")
            
            self.assertIn("id", props, "Props must have 'id' (HTML ID)")
            self.assertIsInstance(props["id"], str, "'id' must be a string")

            # Example for dropdown, expand as more widget types are added
            if props["widgetType"] == "dropdown":
                self.assertIn("label", props, "Dropdown props must have 'label'")
                self.assertIsInstance(props["label"], str, "Dropdown 'label' must be a string")
                
                self.assertIn("options", props, "Dropdown props must have 'options'")
                self.assertIsInstance(props["options"], list, "Dropdown 'options' must be a list")
                for option in props["options"]:
                    self.assertIsInstance(option, dict, "Each dropdown option should be a dictionary")
                    self.assertIn("value", option, "Dropdown option must have 'value'")
                    self.assertIn("label", option, "Dropdown option must have 'label'")
                
                self.assertIn("initialValue", props, "Dropdown props must have 'initialValue'")
                # initialValue can be various types, but often string for dropdowns
                self.assertTrue(isinstance(props["initialValue"], (str, int, float, bool)), 
                                "Dropdown 'initialValue' should be a basic type")

if __name__ == '__main__':
    unittest.main()
