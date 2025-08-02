import { Component, Input, OnInit, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  template: `
    <div class="map-container">
      <div *ngIf="!isGoogleMapsLoaded" class="map-loading">
        <div class="loading-spinner"></div>
        <p>Loading Google Maps...</p>
      </div>
      
      <google-map
        *ngIf="isGoogleMapsLoaded"
        [height]="'300px'"
        [width]="'100%'"
        [center]="center"
        [zoom]="zoom"
        (mapClick)="onMapClick($event)"
      >
        <!-- Route line from pickup to destination -->
        <map-polyline
          *ngIf="showRouteLine && routePath.length > 0"
          [path]="routePath"
          [options]="routeOptions"
        ></map-polyline>

        <!-- Pickup marker -->
        <map-marker
          *ngIf="pickupCoords && pickupCoords.lat !== 0"
          [position]="pickupCoords!"
          [label]="'📍 Pickup'"
          [title]="'Pickup Location'"
          [options]="pickupMarkerOptions"
        ></map-marker>

        <!-- Destination marker -->
        <map-marker
          *ngIf="destinationCoords && destinationCoords.lat !== 0"
          [position]="destinationCoords!"
          [label]="'🎯 Destination'"
          [title]="'Destination Location'"
          [options]="destinationMarkerOptions"
        ></map-marker>

        <!-- Courier marker (current location) -->
        <map-marker
          *ngIf="courierCoords && courierCoords.lat !== 0"
          [position]="courierCoords!"
          [label]="'🚚 Courier'"
          [title]="'Courier Current Location'"
          [options]="courierMarkerOptions"
        ></map-marker>
      </google-map>
      <div *ngIf="mapError" class="map-error">
        <p>⚠️ Map could not be loaded. Please check your internet connection.</p>
        <button (click)="retryLoadMap()" class="retry-btn">🔄 Retry</button>
      </div>
    </div>
  `,
  styleUrls: ['./map.component.css'],
  standalone: true,
  imports: [CommonModule, GoogleMapsModule]
})
export class MapComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() pickupCoords?: google.maps.LatLngLiteral;
  @Input() destinationCoords?: google.maps.LatLngLiteral;
  @Input() courierCoords?: google.maps.LatLngLiteral;

  isGoogleMapsLoaded = false;
  mapError = false;

  // Route line properties
  showRouteLine = false;
  routePath: google.maps.LatLngLiteral[] = [];
  routeOptions: google.maps.PolylineOptions = {
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    geodesic: true,
    zIndex: 1000
  };

  // Marker options
  pickupMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24)
    }
  };

  destinationMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FF5722" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🎯</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24)
    }
  };

  courierMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#2196F3" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚚</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24)
    }
  };

  ngOnInit() {
    console.log('Map component initialized');
    console.log('Pickup coords:', this.pickupCoords);
    console.log('Destination coords:', this.destinationCoords);
    this.checkGoogleMapsAvailability();
    this.updateRouteLine();
  }

  ngAfterViewInit() {
    console.log('Map component after view init');
    this.checkGoogleMapsAvailability();
    this.updateRouteLine();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('Map component changes detected:', changes);
    this.updateRouteLine();
  }

  private updateRouteLine() {
    console.log('🔄 Updating route line...');
    console.log('Pickup coords:', this.pickupCoords);
    console.log('Destination coords:', this.destinationCoords);
    console.log('Courier coords:', this.courierCoords);
    
    if (this.pickupCoords && this.destinationCoords &&
        this.pickupCoords.lat !== 0 && this.destinationCoords.lat !== 0) {
      
      // Create route path
      if (this.courierCoords && this.courierCoords.lat !== 0) {
        // Route: Pickup -> Courier -> Destination
        this.routePath = [this.pickupCoords, this.courierCoords, this.destinationCoords];
        console.log('📍 Route: Pickup -> Courier -> Destination');
      } else {
        // Route: Pickup -> Destination
        this.routePath = [this.pickupCoords, this.destinationCoords];
        console.log('📍 Route: Pickup -> Destination');
      }
      
      this.showRouteLine = true;
      console.log('✅ Route line enabled, path:', this.routePath);
    } else {
      this.showRouteLine = false;
      this.routePath = [];
      console.log('❌ Route line disabled - invalid coordinates');
    }
  }

  private checkGoogleMapsAvailability() {
    console.log('Checking Google Maps availability...');
    console.log('typeof google:', typeof google);
    console.log('google.maps:', google?.maps);
    
    if (typeof google !== 'undefined' && google.maps) {
      this.isGoogleMapsLoaded = true;
      this.mapError = false;
      console.log('✅ Google Maps loaded successfully');
      this.updateRouteLine();
    } else {
      console.log('❌ Google Maps not available yet, retrying...');
      setTimeout(() => {
        if (typeof google !== 'undefined' && google.maps) {
          this.isGoogleMapsLoaded = true;
          this.mapError = false;
          console.log('✅ Google Maps loaded on retry');
          this.updateRouteLine();
        } else {
          this.mapError = true;
          console.error('❌ Google Maps failed to load');
        }
      }, 2000);
    }
  }

  retryLoadMap() {
    this.mapError = false;
    this.checkGoogleMapsAvailability();
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    console.log('Map clicked at:', event.latLng);
  }

  get center(): google.maps.LatLngLiteral {
    // If courier location is available and valid, center on courier
    if (this.courierCoords && this.courierCoords.lat !== 0) {
      return this.courierCoords;
    }
    
    // If both pickup and destination are valid, center between them
    if (this.pickupCoords && this.destinationCoords &&
        this.pickupCoords.lat !== 0 && this.destinationCoords.lat !== 0) {
      return {
        lat: (this.pickupCoords.lat + this.destinationCoords.lat) / 2,
        lng: (this.pickupCoords.lng + this.destinationCoords.lng) / 2
      };
    }
    
    // If only pickup is valid
    if (this.pickupCoords && this.pickupCoords.lat !== 0) {
      return this.pickupCoords;
    }
    
    // If only destination is valid
    if (this.destinationCoords && this.destinationCoords.lat !== 0) {
      return this.destinationCoords;
    }
    
    // Default to Nairobi
    return { lat: -1.286389, lng: 36.817223 };
  }

  get zoom(): number {
    // If both coordinates are valid, zoom out to show both
    if (this.pickupCoords && this.destinationCoords && 
        this.pickupCoords.lat !== -1.286389 && this.destinationCoords.lat !== -1.286389) {
      const distance = this.calculateDistance(
        this.pickupCoords.lat, this.pickupCoords.lng,
        this.destinationCoords.lat, this.destinationCoords.lng
      );
      
      // Adjust zoom based on distance
      if (distance > 100) return 8; // Long distance
      if (distance > 50) return 9;  // Medium distance
      if (distance > 10) return 10; // Short distance
      return 12; // Very close
    }
    
    return 12; // Default zoom
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
} 