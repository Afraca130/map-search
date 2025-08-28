class MapManager {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.poiMarkers = [];
        this.userLocation = null;
        this.watchId = null;
        this.mapType = null; // 'tmap' 또는 'leaflet'

        this.initializeMap();
        this.initializeEventListeners();
        this.startLocationTracking();
    }

    initializeMap() {
        // TMAP 먼저 시도
        if (typeof Tmapv2 !== 'undefined') {
            try {
                console.log('Initializing TMAP V2 Map...');
                this.initializeTmapV2();
                return;
            } catch (error) {
                console.error('TMAP 지도 초기화 오류:', error);
            }
        }

        // Leaflet으로 대체
        if (typeof L !== 'undefined') {
            console.log('TMAP 사용 불가, Leaflet 지도로 대체...');
            this.initializeLeafletMap();
        } else {
            console.error('지도 라이브러리를 찾을 수 없습니다.');
            this.showErrorMessage();
        }
    }

    initializeTmapV2() {
        this.mapType = 'tmap';

        this.map = new Tmapv2.Map('map_div', {
            center: new Tmapv2.LatLng(37.5665, 126.978),
            width: '100%',
            height: '100vh',
            zoom: 15,
            zoomControl: true,
            scrollwheel: true,
        });

        console.log('TMAP V2 Map initialized successfully');

        this.map.addListener('load', () => {
            console.log('TMAP V2 지도가 성공적으로 로드되었습니다.');
            this.updateStatus('TMAP 지도 로드 완료');
            this.refreshPoiData();
        });
    }

    initializeLeafletMap() {
        this.mapType = 'leaflet';

        // Leaflet 지도 초기화
        this.map = L.map('map_div').setView([37.5665, 126.978], 15);

        // OpenStreetMap 타일 레이어 추가
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(this.map);

        console.log('Leaflet Map initialized successfully');
        this.updateStatus('Leaflet 지도 로드 완료');
        this.refreshPoiData();
    }

    showErrorMessage() {
        console.log('Showing error message');
        const mapDiv = document.getElementById('map_div');
        if (mapDiv) {
            mapDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; font-family: Arial, sans-serif;">
                    <div>
                        <h2 style="margin-bottom: 20px;">지도를 로드할 수 없습니다</h2>
                        <p style="margin-bottom: 20px;">지도 라이브러리를 사용할 수 없습니다.</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            페이지 새로고침
                        </button>
                    </div>
                </div>
            `;
        }
        this.updateStatus('지도 로드 실패');
    }

    initializeEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const refreshButton = document.getElementById('refreshButton');
        const importButton = document.getElementById('importButton');
        const locationButton = document.getElementById('locationButton');

        if (searchInput && searchButton) {
            searchButton.addEventListener('click', () => {
                this.searchPoi(searchInput.value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPoi(searchInput.value);
                }
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshPoiData();
            });
        }

        if (importButton) {
            importButton.addEventListener('click', () => {
                this.openFileUploadDialog();
            });
        }

        if (locationButton) {
            locationButton.addEventListener('click', () => {
                this.goToUserLocation();
            });
        }
    }

    startLocationTracking() {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updateUserLocation(position);
            },
            (error) => {
                console.error('Error getting location:', error);
                this.setDefaultLocation();
            },
            options,
        );

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.updateUserLocation(position);
            },
            (error) => {
                console.error('Error getting initial location:', error);
                this.setDefaultLocation();
            },
            options,
        );
    }

    setDefaultLocation() {
        const lat = 37.5665;
        const lng = 126.978;

        if (this.mapType === 'tmap') {
            const defaultLocation = new Tmapv2.LatLng(lat, lng);
            this.userLocation = defaultLocation;
            this.updateUserMarker(defaultLocation);
            this.map.setCenter(defaultLocation);
        } else if (this.mapType === 'leaflet') {
            this.userLocation = [lat, lng];
            this.updateUserMarker([lat, lng]);
            this.map.setView([lat, lng], 15);
        }
    }

    updateUserLocation(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (this.mapType === 'tmap') {
            const location = new Tmapv2.LatLng(lat, lng);
            this.userLocation = location;
            this.updateUserMarker(location);

            if (!this.map.getCenter() || Math.abs(this.map.getCenter().lat() - lat) > 0.01) {
                this.map.setCenter(location);
            }
        } else if (this.mapType === 'leaflet') {
            this.userLocation = [lat, lng];
            this.updateUserMarker([lat, lng]);

            const center = this.map.getCenter();
            if (!center || Math.abs(center.lat - lat) > 0.01) {
                this.map.setView([lat, lng], this.map.getZoom());
            }
        }
    }

    updateUserMarker(location) {
        // 기존 마커 제거
        if (this.userMarker) {
            if (this.mapType === 'tmap') {
                this.userMarker.setMap(null);
            } else if (this.mapType === 'leaflet') {
                this.map.removeLayer(this.userMarker);
            }
        }

        // 새 마커 생성
        if (this.mapType === 'tmap') {
            this.userMarker = new Tmapv2.Marker({
                position: location,
                icon: 'https://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_a.png',
                map: this.map,
                title: '현재 위치',
            });
        } else if (this.mapType === 'leaflet') {
            const blueIcon = L.icon({
                iconUrl:
                    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                shadowUrl:
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            this.userMarker = L.marker(location, { icon: blueIcon })
                .addTo(this.map)
                .bindPopup('현재 위치');
        }
    }

    goToUserLocation() {
        if (this.userLocation) {
            if (this.mapType === 'tmap') {
                this.map.setCenter(this.userLocation);
                this.map.setZoom(16);
            } else if (this.mapType === 'leaflet') {
                this.map.setView(this.userLocation, 16);
            }
            this.updateStatus('현재 위치로 이동했습니다.');
        } else {
            this.updateStatus('현재 위치를 찾을 수 없습니다.');
        }
    }

    updateStatus(message) {
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
            statusBar.textContent = message;
            setTimeout(() => {
                statusBar.textContent = `POI: ${this.poiMarkers.length}개 | 현재 위치 추적 중`;
            }, 3000);
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('show');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
        }
    }

    async refreshPoiData() {
        this.showLoading();
        try {
            this.updateStatus('POI 데이터를 불러오는 중...');
            const response = await fetch('/api/poi');
            const result = await response.json();

            if (Number(result.statusCode) === 200 && Array.isArray(result.resultData)) {
                const poiList = result.resultData;
                this.displayPoiMarkers(poiList);
                console.log(`${poiList.length}개의 POI 데이터를 로드했습니다.`);
                this.updateStatus(`${poiList.length}개의 POI 데이터를 로드했습니다.`);
            } else {
                const message = result.statusMessage || 'POI 데이터 로드에 실패했습니다.';
                console.error('Failed to load POI data:', message);
                this.updateStatus('POI 데이터 로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error loading POI data:', error);
            this.updateStatus('POI 데이터 로드 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    displayPoiMarkers(poiData) {
        this.clearPoiMarkers();

        if (!poiData || poiData.length === 0) {
            console.log('표시할 POI 데이터가 없습니다.');
            return;
        }

        poiData.forEach((poi) => {
            if (poi.latitude && poi.longitude) {
                if (this.mapType === 'tmap') {
                    this.addTmapPoiMarker(poi);
                } else if (this.mapType === 'leaflet') {
                    this.addLeafletPoiMarker(poi);
                }
            }
        });

        // 모든 마커가 보이도록 지도 범위 조정
        if (this.poiMarkers.length > 0) {
            this.fitBoundsToMarkers();
        }
    }

    addTmapPoiMarker(poi) {
        const marker = new Tmapv2.Marker({
            position: new Tmapv2.LatLng(poi.latitude, poi.longitude),
            icon: 'https://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_a.png',
            map: this.map,
            title: poi.title,
        });

        const infoWindow = new Tmapv2.InfoWindow({
            position: new Tmapv2.LatLng(poi.latitude, poi.longitude),
            content: this.createPoiInfoContent(poi),
            type: 1,
        });

        marker.addListener('click', () => {
            infoWindow.open();
            this.map.setCenter(new Tmapv2.LatLng(poi.latitude, poi.longitude));
            this.map.setZoom(16);
        });

        this.poiMarkers.push({ marker, infoWindow, poi });
    }

    addLeafletPoiMarker(poi) {
        const redIcon = L.icon({
            iconUrl:
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl:
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        const marker = L.marker([poi.latitude, poi.longitude], { icon: redIcon })
            .addTo(this.map)
            .bindPopup(this.createPoiInfoContent(poi));

        marker.on('click', () => {
            this.map.setView([poi.latitude, poi.longitude], 16);
        });

        this.poiMarkers.push({ marker, poi });
    }

    createPoiInfoContent(poi) {
        const created = poi.created_at || poi.createdAt;
        return `
            <div style="padding: 10px; min-width: 200px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 5px 0; font-weight: bold; color: #333;">${poi.title}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                    위치: ${parseFloat(poi.latitude).toFixed(6)}, ${parseFloat(
            poi.longitude,
        ).toFixed(6)}
                </p>
                ${
                    created
                        ? `<p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
                    등록일: ${new Date(created).toLocaleDateString()}
                </p>`
                        : ''
                }
            </div>
        `;
    }

    fitBoundsToMarkers() {
        if (this.poiMarkers.length === 0) return;

        try {
            if (this.mapType === 'tmap') {
                const bounds = new Tmapv2.LatLngBounds();

                this.poiMarkers.forEach(({ marker }) => {
                    bounds.extend(marker.getPosition());
                });

                this.map.fitBounds(bounds);

                setTimeout(() => {
                    const currentZoom = this.map.getZoom();
                    if (currentZoom > 16) {
                        this.map.setZoom(16);
                    }
                }, 100);
            } else if (this.mapType === 'leaflet') {
                const group = new L.featureGroup(this.poiMarkers.map((item) => item.marker));
                this.map.fitBounds(group.getBounds());

                setTimeout(() => {
                    const currentZoom = this.map.getZoom();
                    if (currentZoom > 16) {
                        this.map.setZoom(16);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('지도 범위 조정 중 오류:', error);
        }
    }

    clearPoiMarkers() {
        this.poiMarkers.forEach(({ marker, infoWindow }) => {
            if (this.mapType === 'tmap') {
                if (infoWindow) {
                    infoWindow.close();
                }
                marker.setMap(null);
            } else if (this.mapType === 'leaflet') {
                this.map.removeLayer(marker);
            }
        });
        this.poiMarkers = [];
    }

    async searchPoi(searchText) {
        if (!searchText || searchText.trim() === '') {
            this.refreshPoiData();
            return;
        }

        this.showLoading();
        try {
            this.updateStatus('POI를 검색하는 중...');
            const response = await fetch(
                `/api/poi/search?searchText=${encodeURIComponent(searchText.trim())}`,
            );
            const result = await response.json();

            if (Number(result.statusCode) === 200 && Array.isArray(result.resultData)) {
                const poiList = result.resultData;
                this.displayPoiMarkers(poiList);

                if (poiList.length > 0) {
                    const firstPoi = poiList[0];
                    if (firstPoi.latitude && firstPoi.longitude) {
                        if (this.mapType === 'tmap') {
                            const location = new Tmapv2.LatLng(
                                firstPoi.latitude,
                                firstPoi.longitude,
                            );
                            this.map.setCenter(location);
                            this.map.setZoom(16);
                        } else if (this.mapType === 'leaflet') {
                            this.map.setView([firstPoi.latitude, firstPoi.longitude], 16);
                        }
                    }
                    console.log(`검색 결과: ${poiList.length}개의 POI를 찾았습니다.`);
                    this.updateStatus(`검색 결과: ${poiList.length}개의 POI를 찾았습니다.`);
                } else {
                    console.log('검색 결과가 없습니다.');
                    this.updateStatus('검색 결과가 없습니다.');
                }
            } else {
                const message = result.statusMessage || 'POI 검색에 실패했습니다.';
                console.error('POI 검색 실패:', message);
                this.updateStatus('POI 검색에 실패했습니다.');
            }
        } catch (error) {
            console.error('POI 검색 오류:', error);
            this.updateStatus('POI 검색 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    openFileUploadDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadExcelFile(file);
            }
        };
        input.click();
    }

    async uploadExcelFile(file) {
        const formData = new FormData();
        formData.append('excelFile', file);

        this.showLoading();
        try {
            console.log('엑셀 파일 업로드 중...');
            this.updateStatus('엑셀 파일을 업로드하고 처리하는 중...');

            const response = await fetch('/api/upload-excel', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (Number(result.statusCode) === 200 && result.resultData) {
                const count = result.resultData.count || 0;
                console.log(`엑셀 업로드 성공: ${count}개의 POI 데이터가 업데이트되었습니다.`);
                this.updateStatus(
                    `엑셀 업로드 성공: ${count}개의 POI 데이터가 업데이트되었습니다.`,
                );
                await this.refreshPoiData();
                if (
                    Array.isArray(result.resultData.errors) &&
                    result.resultData.errors.length > 0
                ) {
                    console.warn(`일부 행에서 오류 발생: ${result.resultData.errors.length}개`);
                }
            } else {
                const message = result.statusMessage || '엑셀 파일 업로드에 실패했습니다.';
                console.error('엑셀 업로드 실패:', message);
                this.updateStatus('엑셀 파일 업로드에 실패했습니다.');
                alert('엑셀 파일 업로드에 실패했습니다: ' + message);
            }
        } catch (error) {
            console.error('엑셀 업로드 오류:', error);
            this.updateStatus('엑셀 파일 업로드 중 오류가 발생했습니다.');
            alert('엑셀 파일 업로드 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    destroy() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        this.clearPoiMarkers();
        if (this.userMarker) {
            if (this.mapType === 'tmap') {
                this.userMarker.setMap(null);
            } else if (this.mapType === 'leaflet') {
                this.map.removeLayer(this.userMarker);
            }
        }
    }
}

let mapManager;

// getScript에서 TMAP API가 로드된 후 호출되거나 DOM 로드 시 호출될 함수
window.initMapManager = function () {
    console.log('initMapManager called');

    try {
        mapManager = new MapManager();
        document.getElementById('statusBar').textContent = '지도 초기화 완료';
        console.log('MapManager 초기화 성공');
    } catch (error) {
        console.error('MapManager 초기화 오류:', error);
        document.getElementById('statusBar').textContent = '지도 초기화 실패: ' + error.message;
    }
};

// DOM 로드 완료 시 바로 실행 (Leaflet은 이미 로드되어 있음)
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing map...');

    // UI 요소들이 제대로 보이는지 확인
    setTimeout(() => {
        const searchBar = document.querySelector('.search-bar');
        const controlButtons = document.querySelector('.control-buttons');
        const statusBar = document.querySelector('.status-bar');
        const mapDiv = document.getElementById('map_div');

        if (searchBar) {
            console.log('검색바 발견:', {
                display: getComputedStyle(searchBar).display,
                visibility: getComputedStyle(searchBar).visibility,
                zIndex: getComputedStyle(searchBar).zIndex,
                position: getComputedStyle(searchBar).position,
            });
            // 검색바 강제로 보이게 하기
            searchBar.style.display = 'block';
            searchBar.style.visibility = 'visible';
        } else {
            console.error('검색바를 찾을 수 없습니다');
        }

        if (mapDiv) {
            console.log('지도 컨테이너:', {
                zIndex: getComputedStyle(mapDiv).zIndex,
                position: getComputedStyle(mapDiv).position,
            });
        }

        window.initMapManager();
    }, 100);
});

window.addEventListener('beforeunload', function () {
    if (mapManager) {
        mapManager.destroy();
    }
});
