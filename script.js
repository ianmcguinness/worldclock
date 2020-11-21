import { cities, days, months } from './utils.js'

cities.sort((a, b) => {
  if (a.city.toLowerCase() < b.city.toLowerCase()) return -1
  if (a.city.toLowerCase() > b.city.toLowerCase()) return 1
  return 0
})

const getDateSuffix = date => {
  if ([1, 21, 31].includes(date)) return 'st'
  if ([2, 22].includes(date)) return 'nd'
  if ([3, 23].includes(date)) return 'rd'
  return 'th'
}

const getTimeOfDay = hours => {
  if (hours >= 6 && hours < 12) return 'Morning'
  if (hours >= 12 && hours < 17) return 'Afternoon'
  if (hours >= 17 && hours < 21) return 'Evening'
  return 'Night'
}

const getIcon = hours => {
  const time = getTimeOfDay(hours)
  if (time === 'Morning' || time === 'Afternoon') return 'fa-sun'
  return 'fa-moon'
}

const parseData = (response, location) => {
  const datetime = new Date(response.datetime.slice(0, -6))

  let city
  let country

  if (location) {
    city = location.city
    country = location.country
  } else {
    const timezone = response.timezone
    const targetCity = cities.find(city => city.search === timezone)
    city = targetCity.city
    country = targetCity.country
  }

  return {
    timezone: response.abbreviation,
    location: response.timezone,
    city,
    country,
    year: datetime.getFullYear(),
    month: months[datetime.getMonth()],
    day: datetime.getDate(),
    weekday: days[datetime.getDay()],
    hours: `${datetime.getHours()}`.padStart(2, 0),
    mins: `${datetime.getMinutes()}`.padStart(2, 0),
    suffix: getDateSuffix(datetime.getDate()),
    dayOfWeek: response.day_of_week,
    dayOfYear: response.day_of_year,
    weekNumber: response.week_number
  }
}

const updateDOM = data => {
  // Clock Section
  document.querySelector('.hours').textContent = data.hours
  document.querySelector('.mins').textContent = data.mins
  document.querySelector('.timezone').textContent = data.timezone
  document.querySelector(
    '.date'
  ).textContent = `${data.weekday} ${data.day}${data.suffix} ${data.month} ${data.year}`
  document.querySelector('.city').textContent = `${data.city}, ${data.country}`
  document.querySelector('.time-of-day').textContent = getTimeOfDay(data.hours)

  // Bottom Section
  document.querySelector('.current-timezone p').textContent = data.location
  document.querySelector('.day-of-year p').textContent = data.dayOfYear
  document.querySelector('.day-of-week p').textContent = `${data.dayOfWeek} (${
    days[data.dayOfWeek]
  })`
  document.querySelector('.week-num p').textContent = data.weekNumber

  // Styles
  document.querySelector(
    '.clock'
  ).style.backgroundImage = `url(./img/${getTimeOfDay(data.hours)}.jfif)`
  document.querySelector('.icon i').classList.remove('fa-sun', 'fa-moon')
  document.querySelector('.icon i').classList.add(getIcon(data.hours))
}

const getCityTime = async city => {
  const res = await axios.get(
    `http://worldtimeapi.org/api/timezone/${city.search}`
  )

  const data = parseData(res.data, city)
  updateDOM(data)
}

const getLocalTime = async () => {
  const res = await axios.get('http://worldtimeapi.org/api/ip')

  const data = parseData(res.data)
  updateDOM(data)
}

const init = () => {
  getLocalTime()
}

init()

// More Button
document.querySelector('.more').addEventListener('click', function () {
  const icon = this.querySelector('i')
  const btn = this.querySelector('.button-text')
  const moreInfoSection = document.querySelector('.more-info')
  icon.classList.toggle('fa-chevron-up')
  icon.classList.toggle('fa-chevron-down')
  btn.textContent = btn.textContent === 'More' ? 'Less' : 'More'
  moreInfoSection.classList.toggle('hidden')
  moreInfoSection.scrollIntoView({ behavior: 'smooth' })
})

// Autocomplete Widget

const input = document.querySelector('.city-search')
const autocomplete = document.querySelector('.autocomplete')
let timeout

const onInput = () => {
  if (timeout) clearTimeout(timeout)
  autocomplete.classList.remove('hidden')
  autocomplete.innerHTML = ''
  timeout = setTimeout(() => {
    cities.forEach(city => {
      if (
        city.city.toLowerCase().includes(input.value.toLowerCase()) ||
        city.country.toLowerCase().includes(input.value.toLowerCase())
      ) {
        const option = document.createElement('div')
        option.classList.add('option')
        option.innerHTML = `<div class="city-select">${city.city}</div>
        <div class="country">${city.country}</div>`
        autocomplete.append(option)

        option.addEventListener('click', e => {
          input.value = city.city
          onOptionSelect(city, input)
        })
      }
    })
  }, 500)
}

const onOptionSelect = city => {
  getCityTime(city)
  autocomplete.classList.add('hidden')
  input.value = ''
}

input.addEventListener('input', onInput)

document.querySelector('.local-search').addEventListener('click', getLocalTime)

document.addEventListener('click', e => {
  if (!document.querySelector('.search-region').contains(e.target))
    autocomplete.classList.add('hidden')
})
