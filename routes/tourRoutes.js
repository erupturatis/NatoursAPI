const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

router.param('id', tourController.checkID);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    tourController.checkBody,
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.findingTours)
  .patch(tourController.patchingTours)
  .delete(tourController.deleteTour);

module.exports = router;
