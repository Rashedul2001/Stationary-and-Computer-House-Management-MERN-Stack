import { SiteSettings } from '../models/SiteSettings.js';
import { uploadImageBuffer, deleteCloudinaryImage } from '../services/cloudinaryService.js';
import { geocodeAddress } from '../services/weatherService.js';
import { recordActivity } from '../services/activityLogService.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

function toSlug(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || `cat-${Date.now()}`;
}

export async function updateSiteSettings(req, res, next) {
  try {
    const settings = await SiteSettings.findOne({ singletonKey: 'main' });
    if (!settings) return sendError(res, 'Site settings not initialized.', 404);

    const payload = req.body || {};
    const editableFields = [
      'storeName',
      'proprietor',
      'heroTitle',
      'heroSubtitle',
      'address',
      'phones',
      'whatsappNumber',
      'email',
      'facebookUrl',
      'openingHours',
      'githubUrl',
      'pageHeaders',
    ];

    const prevAddressEn = settings.address?.en;
    for (const field of editableFields) {
      if (payload[field] !== undefined) {
        settings[field] = payload[field];
      }
    }

    const nextAddress = payload.address?.en || payload.address?.bn;
    if (nextAddress && payload.address?.en !== prevAddressEn) {
      const geo = await geocodeAddress(payload.address.en || payload.address.bn);
      settings.coordinates = { lat: geo.lat, lng: geo.lng };
    }

    await settings.save();

    await recordActivity({
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: 'Updated site settings',
      dataSnapshot: payload,
      user: req.user,
    });

    return sendSuccess(res, settings, 'Site settings updated.');
  } catch (err) {
    return next(err);
  }
}

export async function uploadHeroImage(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'Please select an image file to upload.', 400);
    }

    const settings = await SiteSettings.findOne({ singletonKey: 'main' });
    if (!settings) return sendError(res, 'Site settings not initialized.', 404);

    const uploaded = await uploadImageBuffer(req.file.buffer, 'laksam_it_house/hero');
    const oldPublicId = settings.heroImagePublicId;

    settings.heroImageUrl = uploaded.url;
    settings.heroImagePublicId = uploaded.publicId;
    await settings.save();

    if (oldPublicId) {
      await deleteCloudinaryImage(oldPublicId);
    }

    await recordActivity({
      action: 'UPDATE_HERO_IMAGE',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: 'Updated hero image via Cloudinary',
      dataSnapshot: { heroImageUrl: uploaded.url },
      user: req.user,
    });

    return sendSuccess(res, settings, 'Hero image uploaded.');
  } catch (err) {
    return next(err);
  }
}

export async function addCategory(req, res, next) {
  try {
    const { type } = req.params;
    const field = type === 'expense' ? 'expenseCategories' : 'productCategories';
    const { name, slug } = req.validatedBody;

    const settings = await SiteSettings.findOne({ singletonKey: 'main' });
    if (!settings) return sendError(res, 'Site settings not initialized.', 404);

    const resolvedSlug = toSlug(slug || name.en || name.bn);
    if (settings[field].some((c) => c.slug === resolvedSlug)) {
      return sendError(res, 'Category with this slug already exists.', 409);
    }

    settings[field].push({ slug: resolvedSlug, name });
    await settings.save();

    await recordActivity({
      action: 'ADD_CATEGORY',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: `Added ${type} category: ${name.en || name.bn}`,
      dataSnapshot: { type, slug: resolvedSlug, name },
      user: req.user,
    });

    return sendSuccess(res, settings, 'Category added.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { type, catId } = req.params;
    const field = type === 'expense' ? 'expenseCategories' : 'productCategories';
    const { name } = req.validatedBody;

    const settings = await SiteSettings.findOne({ singletonKey: 'main' });
    if (!settings) return sendError(res, 'Site settings not initialized.', 404);

    const target = settings[field].id(catId);
    if (!target) return sendError(res, 'Category not found.', 404);

    target.name = name;
    await settings.save();

    await recordActivity({
      action: 'UPDATE_CATEGORY',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: `Updated ${type} category: ${name.en || name.bn}`,
      dataSnapshot: { type, catId, name },
      user: req.user,
    });

    return sendSuccess(res, settings, 'Category updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { type, catId } = req.params;
    const field = type === 'expense' ? 'expenseCategories' : 'productCategories';

    const settings = await SiteSettings.findOne({ singletonKey: 'main' });
    if (!settings) return sendError(res, 'Site settings not initialized.', 404);

    const target = settings[field].id(catId);
    if (!target) return sendError(res, 'Category not found.', 404);

    const removedName = target.name?.en || target.slug;
    target.deleteOne();
    await settings.save();

    await recordActivity({
      action: 'DELETE_CATEGORY',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: `Deleted ${type} category: ${removedName}`,
      dataSnapshot: { type, catId },
      user: req.user,
    });

    return sendSuccess(res, settings, 'Category deleted.');
  } catch (err) {
    return next(err);
  }
}
