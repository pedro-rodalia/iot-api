const mongoose = require('mongoose');

/* DATA MODELS */
const Device = require('../models/device');
const Display = require('../models/display');
const Gateway = require('../models/gateway');
const UserGroup = require('../models/userGroup');

/* GET ALL */
exports.devices_get_all = (req, res, next) => {
  Device.find()
    .select('_id id name description url mac_address bt_address created_at updated_at')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        data: docs.map((doc) => {
          return{
            _id: doc._id,
            url: doc.url,
            id: doc.id,
            name: doc.name,
            description: doc.description,
            mac_address: doc.mac_address,
            bt_address: doc.bt_address,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          }
        })
      }
      console.log(response);
      setTimeout(() => { res.status(200).json(response) }, 0);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({error: err});
    });
}

/* GET ONE */
exports.devices_get_one = (req, res, next) => {
  const _id = req.params.id;
  Device.findById(_id)
    .select('_id id url name description resolution bt_address mac_address bt_address display userGroup created_by created_at updated_at')
    .populate('display', '_id url name')
    .populate('gateway', '_id url name')
    .populate('created_by', '_id url name')
    .populate('updated_by', '_id url name')
    .populate('resolution', '_id url name')
    .populate('location', '_id url name')
    .populate('userGroup', '_id url name')
    .exec()
    .then(doc => {
      if (doc) {
        res.status(200).json(doc);
      } else {
        res.status(404).json({message: 'No valid entry found for provided id'});
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({error: err});
    });
}

/* POST */
exports.device_create = (req, res, next) => {
  const { id, name, description, created_by, resolution, mac_address, bt_address, gateway, userGroup } = req.body;
  console.log(req.body);
  // create a new id for the device
  const _id = new mongoose.Types.ObjectId();
  // create userGroup and gateway id from data received
  const u_id = mongoose.Types.ObjectId(userGroup);
  const g_id = mongoose.Types.ObjectId(gateway);
  const device = new Device({
    _id: _id,
    url: 'http://localhost:4000/devices/' + _id,
    id: id,
    name: name,
    description: description,
    resolution: resolution,
    gateway: gateway,
    created_by: created_by,
    mac_address: mac_address,
    bt_address: bt_address,
    userGroup: userGroup,
  });

  device
    .save()
    // update gateway involved
    .then(() => {
      return Gateway
        // add the image id to the display array
        .update({ _id: g_id }, { $addToSet: { devices: _id } })
        .then(doc => console.log(doc))
    })
    // update userGroups involved
    .then(() => {
      return UserGroup
        // add the image id to the display array
        .update({ _id: u_id }, { $addToSet: { devices: _id } })
        .then(doc => console.log(doc))
    })
    .then((res) => Device.findById(_id).exec())
    .then((doc) => {
      const result = {
        _id: doc._id,
        url: doc.url,
        id: doc.id,
        name: doc.name,
        description: doc.description,
        created_at: doc.created_at,
      }
      res.status(201).json({
        message: 'Success at adding a new device to the collection',
        success: true,
        result: result
      });
    })
    // catch any errors
    .catch(err => {
      console.log(err);
      res.status(500).json({
        message: 'Internal Server Error',
        error: err
      });
    });
}

/* PUT */
exports.device_update = (req, res, next) => {
  // get the id from the request for the query
  const _id = req.params.id;
  // get userGroup id from the request
  const { userGroup, gateway } = req.body;
  // create userGroup id from data received
  const u_id = mongoose.Types.ObjectId(userGroup);
  const g_id = mongoose.Types.ObjectId(gateway);
  // update the group based on its id
  const updateObject = req.body;
  updateObject.updated_at = new Date();
  Device
    .findOneAndUpdate({ _id: _id }, { $set: updateObject }, { new: true })
    // update userGroups involved
    .then(() => {
      return UserGroup
        // add the group id to the group array
        .update({ devices: _id }, { $pull: { devices: _id } })
        .then(doc => console.log(doc))
    })
    .then(() => {
      return UserGroup
        // add the group id to the group array
        .update({ _id: u_id }, { $addToSet: { devices: _id } })
        .then(doc => console.log(doc))
    })
    // update gateways involved
    .then(() => {
      return Gateway
        // add the image id to the display array
        .update({ devices: _id }, { $pull: { devices: _id } })
        .then(doc => console.log(doc))
    })
    .then(() => {
      console.log(g_id);
      return Gateway
        // add the image id to the display array
        .update({ _id: g_id }, { $addToSet: { devices: _id } })
        .then(doc => console.log(doc))
    })
    // send a response to the app
    .then((res) => Device.findById(_id).exec())
    .then(doc => {
      const result = {
        _id: doc._id,
        url: doc.url,
        id: doc.id,
        name: doc.name,
        description: doc.description,
        created_at: doc.created_at,
      }
      res.status(200).json({
        message: 'Success at updating a device from the collection',
        success: true,
        result: result
      });
    })
    // catch any errors
    .catch(err => {
      console.log(err);
      res.status(500).json({
        message: 'Internal Server Error',
        error: err
      });
    });
}

/* DELETE */
exports.device_delete = (req, res, next) => {
  const _id = req.params.id;
  Device
    .remove({_id: _id})
    .exec()
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({error: err});
    });
}
