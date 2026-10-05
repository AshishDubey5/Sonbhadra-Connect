/**
 * In-Memory Fallback Store for Tourist & Wishlist Data
 * Ensures seamless, instantaneous responses even if MongoDB Atlas IP whitelist
 * blocks external connections during local testing.
 */

class InMemoryStore {
    constructor() {
        this.tourists = new Map(); // id -> touristObj
        this.touristsByEmail = new Map(); // email -> id
        this.initDemoTourist();
    }

    initDemoTourist() {
        const demoId = "661234567890abcdef123456";
        const demoTourist = {
            _id: demoId,
            fullName: "Aarav Sharma",
            email: "aarav.test@example.com",
            phone: "+91 98765 43210",
            hometown: "Varanasi, UP",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            ecoPoints: 120,
            wishlist: [],
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        this.tourists.set(demoId, demoTourist);
        this.touristsByEmail.set("aarav.test@example.com", demoId);
    }

    saveTourist(tourist) {
        if (!tourist || !tourist._id) return;
        const id = tourist._id.toString();
        const existing = this.tourists.get(id) || {};
        const merged = { ...existing, ...tourist, _id: id };
        this.tourists.set(id, merged);
        if (tourist.email) {
            this.touristsByEmail.set(tourist.email.toLowerCase().trim(), id);
        }
        return merged;
    }

    getTouristById(id) {
        if (!id) return null;
        return this.tourists.get(id.toString()) || null;
    }

    getTouristByEmail(email) {
        if (!email) return null;
        const id = this.touristsByEmail.get(email.toLowerCase().trim());
        return id ? this.tourists.get(id) : null;
    }

    addToWishlist(touristId, dest) {
        const tourist = this.getTouristById(touristId);
        if (!tourist) return [];
        if (!Array.isArray(tourist.wishlist)) tourist.wishlist = [];

        const cleanSlug = (dest.slug || dest._id || dest).toString().replace(/^dest-/, '').toLowerCase();
        const exists = tourist.wishlist.some(item => {
            const itemSlug = (item.slug || item._id || item).toString().replace(/^dest-/, '').toLowerCase();
            return itemSlug === cleanSlug;
        });

        if (!exists) {
            tourist.wishlist.push(dest);
        }
        return tourist.wishlist;
    }

    removeFromWishlist(touristId, destIdOrSlug) {
        const tourist = this.getTouristById(touristId);
        if (!tourist || !Array.isArray(tourist.wishlist)) return [];

        const clean = destIdOrSlug.toString().replace(/^dest-/, '').toLowerCase();
        tourist.wishlist = tourist.wishlist.filter(item => {
            const itemSlug = (item.slug || item._id || item).toString().replace(/^dest-/, '').toLowerCase();
            return itemSlug !== clean && item._id?.toString() !== destIdOrSlug;
        });
        return tourist.wishlist;
    }

    getWishlist(touristId) {
        const tourist = this.getTouristById(touristId);
        return tourist && Array.isArray(tourist.wishlist) ? tourist.wishlist : [];
    }
}

export const inMemoryStore = new InMemoryStore();
