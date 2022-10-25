const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(
    `${__dirname}/../dev-data/data/tours-simple.json`
  )
);

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'succes',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
};

exports.checkID = (req, res, next, val) => {
  const id = req.params.id * 1;

  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.prize) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const newTour = { ...req.body, id: newId };

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201);
    }
  );

  res.send('Done');
};

exports.findingTours = (req, res) => {
  const tour = tours.find((el) => el.id === req.body.id);

  res.status(200).json({
    status: 'succes',
    data: {
      tour,
    },
  });
};

exports.patchingTours = (req, res) => {
  res.status(200).json({
    status: 'succes',
    data: {
      tour: '<Updated tour>',
    },
  });
};

exports.deleteTour = (req, res) => {};
