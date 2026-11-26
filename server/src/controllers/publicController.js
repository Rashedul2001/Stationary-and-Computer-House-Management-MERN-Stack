import { SiteSettings } from '../models/SiteSettings.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Course } from '../models/Course.js';
import { sendSuccess } from '../utils/apiResponse.js';

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getPublicSettings(_req, res, next) {
  try {
    const settings = await SiteSettings.findOne({ singletonKey: 'main' }).lean();
    return sendSuccess(res, settings);
  } catch (err) {
    return next(err);
  }
}

export async function getPublicProducts(req, res, next) {
  try {
    const { search = '', category = '' } = req.query;
    const filter = {};
    if (category && category !== 'all') {
      filter.categorySlug = String(category).toLowerCase();
    }
    if (search && String(search).trim()) {
      const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$or = [
        { 'name.en': regex },
        { 'name.bn': regex },
        { 'details.en': regex },
        { 'details.bn': regex },
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, products);
  } catch (err) {
    return next(err);
  }
}

export async function getPublicServices(req, res, next) {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$or = [
        { 'name.en': regex },
        { 'name.bn': regex },
        { 'details.en': regex },
        { 'details.bn': regex },
      ];
    }
    const services = await Service.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, services);
  } catch (err) {
    return next(err);
  }
}

export async function getPublicCourses(req, res, next) {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$or = [
        { 'title.en': regex },
        { 'title.bn': regex },
        { 'description.en': regex },
        { 'description.bn': regex },
      ];
    }
    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, courses);
  } catch (err) {
    return next(err);
  }
}
