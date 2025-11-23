import "dotenv/config";
import { prisma } from '../lib/prisma';

async function _seedLanguage() {
  try {
    console.log('🌱 Seeding language data...');

    // Define common languages with RTL support
    const languages = [
      { code: 'en-US', name: 'English (US)', nativeName: 'English', isRTL: false, isActive: true },
      { code: 'en-GB', name: 'English (UK)', nativeName: 'English', isRTL: false, isActive: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true, isActive: true },
      { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false, isActive: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false, isActive: true },
      { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false, isActive: true },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', isRTL: false, isActive: true },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false, isActive: true },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false, isActive: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false, isActive: true },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', isRTL: false, isActive: true },
      { code: 'ko', name: 'Korean', nativeName: '한국어', isRTL: false, isActive: true },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false, isActive: true },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true, isActive: true },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی', isRTL: true, isActive: true },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRTL: true, isActive: true },
    ];

    // Create languages
    console.log('📝 Creating languages...');
    for (const language of languages) {
      const existing = await prisma.language.findUnique({
        where: { code: language.code },
      });

      if (existing) {
        console.log(`  ⏭️  Language "${language.code}" already exists`);
      } else {
        await prisma.language.create({
          data: language,
        });
        console.log(`  ✅ Created language: ${language.code} (${language.name})${language.isRTL ? ' [RTL]' : ''}`);
      }
    }

    // Create default language setting
    console.log('\n📝 Creating default language setting...');
    const defaultLanguage = await prisma.language.findUnique({
      where: { code: 'en-US' },
    });

    if (defaultLanguage) {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: 'default_language' },
      });

      if (existingSetting) {
        await prisma.setting.update({
          where: { key: 'default_language' },
          data: { value: defaultLanguage.id },
        });
        console.log(`  ✅ Updated default language setting to English (US)`);
      } else {
        await prisma.setting.create({
          data: {
            key: 'default_language',
            value: defaultLanguage.id,
          },
        });
        console.log(`  ✅ Created default language setting: English (US)`);
      }
    } else {
      console.log(`  ⚠️  Warning: en-US language not found, cannot set default language`);
    }

    console.log('\n✨ Language seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding language:', error);
    throw error;
  }
}

// Export function without disconnect (for use in unified seed)
export async function seedLanguage() {
  return _seedLanguage();
}

// Allow running this file directly via tsx
const isMainModule = process.argv[1]?.includes('seed-language.ts');

if (isMainModule) {
  (async () => {
    try {
      await _seedLanguage();
      console.log('✅ Seed script completed');
    } catch (error) {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  })();
}

