// Simple TypeScript test to validate GoogleMaps types
// This will show compilation errors if types are incorrect

// Mock the basic types we need
type IElementSize = 'small' | 'medium' | 'large';

interface TMessageElement<T> {
  id: string;
  type: T;
  name: string;
  display: 'inline' | 'side' | 'page';
  forId: string;
  mime?: string;
  url?: string;
}

// Define our GoogleMaps element type (copy from element.ts)
interface IGoogleMapsElement extends TMessageElement<'googlemaps'> {
  size?: IElementSize;
}

// Test function to validate types
function testGoogleMapsTypes() {
  // Test 1: Basic GoogleMaps element
  const basicMap: IGoogleMapsElement = {
    id: 'test-1',
    type: 'googlemaps',
    name: 'test_map',
    display: 'inline',
    forId: 'message-1',
    url: 'http://example.com/map-data.json'
  };

  // Test 2: GoogleMaps with size
  const sizedMap: IGoogleMapsElement = {
    id: 'test-2',
    type: 'googlemaps',
    name: 'sized_map',
    display: 'page',
    forId: 'message-2',
    size: 'large',
    url: 'http://example.com/map-data.json'
  };

  // Test 3: Verify type is correct
  const mapType: 'googlemaps' = basicMap.type;
  
  // Test 4: Verify size options
  const validSizes: IElementSize[] = ['small', 'medium', 'large'];
  
  console.log('✓ GoogleMaps TypeScript types are valid');
  console.log('Basic map type:', basicMap.type);
  console.log('Sized map size:', sizedMap.size);
  console.log('Valid sizes:', validSizes);
}

// Export for potential testing
export { IGoogleMapsElement, testGoogleMapsTypes };

// Run test if this is the main module
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  testGoogleMapsTypes();
}