from unittest.mock import AsyncMock, Mock

from chainlit.data import get_data_layer


async def test_get_data_layer(
    mock_data_layer: AsyncMock,
    mock_get_data_layer: Mock,
):
    # Check whether the data layer is properly set
    assert mock_data_layer == get_data_layer()

    mock_get_data_layer.assert_called_once()

    # Getting the data layer again, should not result in additional call
    assert mock_data_layer == get_data_layer()

    mock_get_data_layer.assert_called_once()
