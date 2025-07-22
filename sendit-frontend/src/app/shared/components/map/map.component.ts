import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  template: `<div #leafletMap class="map-container" style="width: 100%; height: 300px;"></div>`,
  styleUrls: ['./map.component.css'],
  standalone: true
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() pickupCoords: { lat: number, lng: number } = { lat: -1.286389, lng: 36.817223 };
  @Input() destinationCoords: { lat: number, lng: number } = { lat: -4.043477, lng: 39.668206 };
  @ViewChild('leafletMap', { static: false }) leafletMapRef!: ElementRef;

  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private destinationMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['pickupCoords'] || changes['destinationCoords'])) {
      this.updateMapMarkers();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (this.map) return;
    this.map = L.map(this.leafletMapRef.nativeElement).setView([this.pickupCoords.lat, this.pickupCoords.lng], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    if (!this.map) return;
    // Remove old markers/line
    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
    if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);
    if (this.routeLine) this.map.removeLayer(this.routeLine);

    const pickupValid = this.pickupCoords && !isNaN(this.pickupCoords.lat) && !isNaN(this.pickupCoords.lng);
    const destValid = this.destinationCoords && !isNaN(this.destinationCoords.lat) && !isNaN(this.destinationCoords.lng);
    const notSame = pickupValid && destValid && (this.pickupCoords.lat !== this.destinationCoords.lat || this.pickupCoords.lng !== this.destinationCoords.lng);

    if (pickupValid && !destValid) {
      // Only pickup provided
      this.pickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], { title: 'Pickup' }).addTo(this.map);
      this.map.setView([this.pickupCoords.lat, this.pickupCoords.lng], 12);
    } else if (pickupValid && destValid && notSame) {
      // Both provided and not the same
      this.pickupMarker = L.marker([this.pickupCoords.lat, this.pickupCoords.lng], { title: 'Pickup' }).addTo(this.map);
      this.destinationMarker = L.marker([this.destinationCoords.lat, this.destinationCoords.lng], { title: 'Destination' }).addTo(this.map);
      this.routeLine = L.polyline([
        [this.pickupCoords.lat, this.pickupCoords.lng],
        [this.destinationCoords.lat, this.destinationCoords.lng]
      ], { color: 'blue' }).addTo(this.map);
      this.map.fitBounds([
        [this.pickupCoords.lat, this.pickupCoords.lng],
        [this.destinationCoords.lat, this.destinationCoords.lng]
      ], { padding: [50, 50] });
    } else {
      // Neither or both are invalid or the same
      this.map.setView([0, 0], 2);
    }
  }
} 