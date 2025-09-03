**Completeness Level:** Complete

## Overview

Add interactive Google Maps functionality to Chainlit's element system, allowing users to create maps from Python code with markers, coordinate navigation, center positioning, and zoom levels. The implementation must follow Chainlit's established element patterns with backend Python classes, frontend React components, and TypeScript definitions.

## Context

-   **Existing System State:** Chainlit has a mature element system supporting 10 element types including custom elements. Mapbox GL 1.13.3 is available through Plotly.js, but Google Maps provides better marker management and navigation features.
    
-   **Gap Being Addressed:** No dedicated interactive map element exists. Google Maps integration provides superior UX for location-based applications with robust marker systems and navigation capabilities.
    
-   **Implementation Approach:** Use CustomElement framework for maximum flexibility, allowing Google Maps JavaScript API integration without core system modifications.
    

## Functional Requirements

### Core Map Display

**REQ-001:** The system shall provide a Google Maps element that renders interactive maps with configurable center coordinates and zoom levels

_Rationale:_ Interactive maps are fundamental for location-based data visualization and user navigation

-   Acceptance: Map renders with valid latitude/longitude center coordinates
    
-   Acceptance: Map supports zoom levels from 1 (world view) to 20 (building level)
    
-   Acceptance: Map displays within message content inline, side panel, or full page modes
    
-   Acceptance: Map supports responsive sizing and touch interactions on mobile devices
    

**REQ-002:** The system shall support marker placement at specific coordinates with customizable content

_Rationale:_ Markers are essential for highlighting specific locations and providing contextual information

-   Acceptance: Markers display at precise latitude/longitude coordinates
    
-   Acceptance: Markers support popup windows with custom text content
    
-   Acceptance: Multiple markers can be displayed simultaneously on a single map
    
-   Acceptance: Markers support click interactions to show information
    

### Python API Integration

**REQ-003:** The system shall provide a Python interface for creating maps programmatically

_Rationale:_ Seamless integration with Chainlit's Python-centric development model

-   Acceptance: Python class accepts center coordinates (latitude, longitude)
    
-   Acceptance: Python class accepts zoom level parameter (1-20)
    
-   Acceptance: Python class accepts list of markers with coordinates and popup text
    
-   Acceptance: Python class integrates with Chainlit's existing element.send() pattern
    

### Navigation Features

**REQ-004:** The system shall support navigation to specific coordinates programmatically

_Rationale:_ Users need ability to focus map on specific locations dynamically

-   Acceptance: Map can be programmatically centered on new coordinates
    
-   Acceptance: Zoom level can be updated after initial map creation
    
-   Acceptance: Navigation changes trigger smooth map animations
    

### Integration Requirements

**REQ-005:** The Google Maps element shall integrate seamlessly with Chainlit's existing element architecture

_Rationale:_ Consistency with existing element patterns ensures predictable developer experience

-   Acceptance: Follows CustomElement pattern from chainlit/element.py:441-455
    
-   Acceptance: React component loads from public/elements/GoogleMap.jsx
    
-   Acceptance: Props are serialized/deserialized correctly via JSON
    
-   Acceptance: Element supports updateElement() for dynamic property changes
    

## System Flow

## Data Schema

### Python Props Schema

```
{
  "center": {
    "lat": float,      # Latitude (-90 to 90)
    "lng": float       # Longitude (-180 to 180)
  },
  "zoom": int,         # Zoom level (1-20)
  "markers": [
    {
      "lat": float,    # Marker latitude
      "lng": float,    # Marker longitude  
      "popup": str     # Optional popup text
    }
  ],
  "apiKey": str        # Google Maps API key (optional, can be env var)
}
```

### Frontend Component Props

```
interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array;
  apiKey?: string;
}
```

## Error Handling & Edge Cases

-   **Invalid Coordinates:** Latitude outside \[-90, 90\] or longitude outside \[-180, 180\] throws validation error
    
-   **Missing API Key:** Component displays error message with setup instructions
    
-   **Network Issues:** Google Maps API failures show fallback error state
    
-   **Invalid Zoom:** Zoom levels outside \[1, 20\] are clamped to valid range
    
-   **Empty Markers:** Maps display without markers when markers array is empty
    
-   **Large Marker Sets:** Performance consideration for 100+ markers with clustering
    

## Technical Constraints

-   **Google Maps API:** Requires valid API key and billing account setup
    
-   **CustomElement Framework:** Must use public/elements/ JSX loading pattern
    
-   **React Runner:** Limited to available imports from CustomElement/Imports.ts
    
-   **Security:** API key handling must follow secure practices
    
-   **Performance:** Map instances must be properly cleaned up on unmount
    

## Success Criteria

1.  **Developer Experience:** Simple Python API: `cl.CustomElement(name="GoogleMap", props={...})`
    
2.  **Functionality:** Maps display interactively with markers and navigation
    
3.  **Integration:** Seamless operation within Chainlit's element ecosystem
    
4.  **Performance:** Fast loading and smooth interactions
    
5.  **Error Resilience:** Graceful handling of API failures and invalid data