import { Router } from 'express';
import { locationController } from '../controllers/location.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All location management routes require admin access
router.use(authenticate, requireAdmin);

// Hierarchy
router.get('/stats', locationController.getHierarchyStats.bind(locationController));
router.get('/hierarchy', locationController.getFullHierarchy.bind(locationController));

// Continents
router.get('/continents', locationController.getAllContinents.bind(locationController));
router.get('/continents/:id', locationController.getContinentById.bind(locationController));
router.post('/continents', locationController.createContinent.bind(locationController));
router.put('/continents/:id', locationController.updateContinent.bind(locationController));
router.delete('/continents/:id', locationController.deleteContinent.bind(locationController));

// Countries
router.get('/countries', locationController.getAllCountries.bind(locationController));
router.get('/countries/:id', locationController.getCountryById.bind(locationController));
router.post('/countries', locationController.createCountry.bind(locationController));
router.put('/countries/:id', locationController.updateCountry.bind(locationController));
router.delete('/countries/:id', locationController.deleteCountry.bind(locationController));

// Cities
router.get('/cities', locationController.getAllCities.bind(locationController));
router.get('/cities/:id', locationController.getCityById.bind(locationController));
router.post('/cities', locationController.createCity.bind(locationController));
router.put('/cities/:id', locationController.updateCity.bind(locationController));
router.delete('/cities/:id', locationController.deleteCity.bind(locationController));

export default router;
