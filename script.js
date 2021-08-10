'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


// let map,mapEvent;
// console.log(navigator);
// console.log(navigator.geolocation);

class Workout {
    date = new Date();
    id = (new Date().getTime() + '').slice(-10); // never create an id on your own 
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // in km 
        this.duration = duration; // in min
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]
            } ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // in min
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();

    }
    calcSpeed() {
        // in km / h
        this.speed = this.distance / (this.duration / 60);
        return this.pace;
    }
}

class App {
    #map
    #mapEvent
    #mapZoomLevel = 13;
    #workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevation);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("could not get the current location");
            }
            );
        }
    }

    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(position);
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);



        this.#map.on('click', this._showForm.bind(this));

    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
            '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }
    _toggleElevation() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        //get data from the form 
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //check if the data is valid
        if (type === 'running') {
            const cadence = +inputCadence.value;

            if (
                // !Number.isFinite(distance) || 
                // !Number.isFinite(duration) || 
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Input have to be positive numbers');

            workout = new Running([lat, lng], distance, duration, cadence);

        }

        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation)
                || !allPositive(distance, duration, cadence)
            )
                return alert('Input have to be positive numbers');
            workout = new Cycling([lat, lng], distance, duration, elevation);

        }
        // check if workout is running so create a running object 

        this.#workouts.push(workout);
        console.log();

        //check if workout is cycling then create cycling object


        //add the object to workout array

        // render workout on map as marker
        this._renderWorkoutMarker(workout);
        //render workout on list 
        this._renderWorkout(workout);

        this.renderWorkoutMarker()
        //hide form and clear input fields
        this._hideForm();
        // inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        // Set local storage to all workouts
        this._setLocalStorage();

        //display marker 
        // const { lat, lng } = this.#mapEvent.latlng;

    }

    renderWorkoutMarker() {
        L.marker([lat, lng]).addTo(this.#map)
            .bindPopup(L.bindPopup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${type}-popup`,
            }))
            .setPopupContent(
                `${workout.type === 'running' ? 'ðŸƒâ€â™‚ï¸' : 'ðŸš´â€â™€ï¸'} ${workout.description}`
            )
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
              <span class="workout__icon">${workout.type === 'running' ? 'ðŸƒâ€â™‚ï¸' : 'ðŸš´â€â™€ï¸'
            }</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">â±</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
        `;

        if (workout.type === 'running')
            html += `
            <div class="workout__details">
              <span class="workout__icon">âš¡ï¸</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">ðŸ¦¶ðŸ¼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>
          `;

        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
              <span class="workout__icon">âš¡ï¸</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">â›°</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
          `;

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
        if (!this.#map) return;

        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        // using the public interface
        // workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }

}

const app = new App();
// app._getPosition();

