const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log('hellow middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString;
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'succes',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
};

const addTour = (req, res) => {
  console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

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

const findingTours = (req, res) => {
  console.log(req.params);

  const id = req.params.id * 1;

  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }

  const tour = tours.find((el) => el.id === id);

  res.status(200).json({
    status: 'succes',
    data: {
      tour,
    },
  });
};

const patchingTours = (req, res) => {
  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }

  res.status(200).json({
    status: 'succes',
    data: {
      tour: '<Updated tour>',
    },
  });
};

app.get('/api/v1/tours', getAllTours);
app.post('/api/v1/tours', addTour);
app.get('/api/v1/tours/:id', findingTours);
app.patch('/api/v1/tours:id', patchingTours);

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
