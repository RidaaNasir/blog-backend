const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    siteTitle: {
      type: String,
      default: "Delicious Bites"
    },
    siteDescription: {
      type: String,
      default: "A food blog sharing delicious recipes and cooking tips"
    },
    logo: {
      type: String,
      default: "/uploads/site/logo-default.png"
    },
    favicon: {
      type: String,
      default: "/uploads/site/favicon-default.ico"
    },
    primaryColor: {
      type: String,
      default: "#ff6b81"
    },
    secondaryColor: {
      type: String,
      default: "#2f3542"
    },
    footerText: {
      type: String,
      default: "© 2023 Delicious Bites. All rights reserved."
    },
    socialMedia: {
      facebook: {
        type: String,
        default: ""
      },
      twitter: {
        type: String,
        default: ""
      },
      instagram: {
        type: String,
        default: ""
      },
      pinterest: {
        type: String,
        default: ""
      },
      youtube: {
        type: String,
        default: ""
      }
    },
    contactEmail: {
      type: String,
      default: ""
    },
    contactPhone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Since we only need one settings document, we'll use a singleton approach
siteSettingsSchema.statics.getSiteSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // If no settings exist, create default settings
  return await this.create({});
};

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

module.exports = SiteSettings; 