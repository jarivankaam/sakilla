// src/controllers/staff.controller.js
const staffService = require("../services/staff.service");

function coerceBodyForStaff(body) {
  const out = Object.assign({}, body);
  // checkbox to tinyint
  out.active = body.active ? 1 : 0;
  // lege nummers -> undefined
  if (out.store_id === "") delete out.store_id;
  if (out.address_id === "") delete out.address_id;
  return out;
}

const StaffController = {
  get(req, res) {
    const id = req.params.id;
    // lijst + (optioneel) geselecteerde medewerker voor editformulier
    if (!id) {
      staffService.get(null, function (err, list) {
        if (err)
          return res
            .status(err.status || 500)
            .render("staff", { staff: [], error: err.message });
        return res.render("staff", { staff: list, selected: null });
      });
    } else {
      // detail-edit: haal lijst en de geselecteerde op (alles SSR)
      staffService.get(null, function (err, list) {
        if (err)
          return res
            .status(err.status || 500)
            .render("staff", { staff: [], error: err.message });
        staffService.get(id, function (err2, selected) {
          if (err2)
            return res
              .status(err2.status || 500)
              .render("staff", { staff: list, error: err2.message });
          return res.render("staff", { staff: list, selected });
        });
      });
    }
  },

  create(req, res) {
    const payload = coerceBodyForStaff(req.body);
    staffService.create(payload, function (err, created) {
      if (err) {
        // her-render met fout + ingevulde velden
        return staffService.get(null, function (_e, list) {
          return res.status(err.status || 400).render("staff", {
            staff: list,
            selected: payload,
            error: err.message,
          });
        });
      }
      // naar lijst of direct naar edit van nieuwe
      return res.redirect(303, "/staff/" + created.id);
    });
  },

  update(req, res) {
    const payload = coerceBodyForStaff(req.body);
    staffService.update(req.params.id, payload, function (err, updated) {
      if (err) {
        return res
          .status(err.status || 400)
          .render("staff", { error: err.message });
      }
      return res.redirect("/staff/" + updated.id);
    });
  },

  remove(req, res) {
    staffService.remove(req.params.id, function (err) {
      if (err) {
        return staffService.get(null, function (_e, list) {
          return res.status(err.status || 400).render("staff", {
            staff: list,
            selected: null,
            error: err.message,
          });
        });
      }
      return res.redirect(303, "/staff");
    });
  },
};

module.exports = StaffController;
