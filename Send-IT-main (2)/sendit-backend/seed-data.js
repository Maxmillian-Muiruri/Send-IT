const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Create sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'USER',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '0987654321',
        role: 'USER',
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        phone: '5555555555',
        role: 'USER',
      },
    ];

    console.log('👥 Creating sample users...');
    const createdUsers = [];
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(
          `⏭️  User already exists: ${userData.name} (${userData.email})`,
        );
        createdUsers.push(existingUser);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create sample couriers
    console.log('🚚 Creating sample couriers...');
    const couriers = [
      {
        name: 'David Wilson',
        email: 'david@courier.com',
        password: 'courier123',
        phone: '1111111111',
        vehicleType: 'MOTORCYCLE',
        licensePlate: 'KCA 123A',
      },
      {
        name: 'Sarah Brown',
        email: 'sarah@courier.com',
        password: 'courier123',
        phone: '2222222222',
        vehicleType: 'VAN',
        licensePlate: 'KCB 456B',
      },
      {
        name: 'Tom Davis',
        email: 'tom@courier.com',
        password: 'courier123',
        phone: '3333333333',
        vehicleType: 'MOTORCYCLE',
        licensePlate: 'KCC 789C',
      },
    ];

    const createdCouriers = [];
    for (const courierData of couriers) {
      // Check if courier user already exists
      const existingCourierUser = await prisma.user.findUnique({
        where: { email: courierData.email },
      });

      let courierUser;
      if (existingCourierUser) {
        console.log(
          `⏭️  Courier user already exists: ${courierData.name} (${courierData.email})`,
        );
        courierUser = existingCourierUser;
      } else {
        const hashedPassword = await bcrypt.hash(courierData.password, 10);

        // Create user for courier
        courierUser = await prisma.user.create({
          data: {
            name: courierData.name,
            email: courierData.email,
            password: hashedPassword,
            phone: courierData.phone,
            role: 'COURIER',
          },
        });
        console.log(
          `✅ Created courier user: ${courierData.name} (${courierData.email})`,
        );
      }

      // Check if courier profile already exists
      const existingCourier = await prisma.courier.findFirst({
        where: { userId: courierUser.id },
      });

      if (existingCourier) {
        console.log(`⏭️  Courier profile already exists: ${courierData.name}`);
        createdCouriers.push(existingCourier);
        continue;
      }

      // Create courier profile
      const courier = await prisma.courier.create({
        data: {
          userId: courierUser.id,
          vehicleType: courierData.vehicleType,
          licensePlate: courierData.licensePlate,
          locationLat: -1.286389,
          locationLng: 36.817223,
          currentLocation: 'Nairobi, Kenya',
          status: 'AVAILABLE',
        },
      });
      createdCouriers.push(courier);
      console.log(
        `✅ Created courier profile: ${courierData.name} (${courierData.email})`,
      );
    }

    // Create sample addresses
    console.log('📍 Creating sample addresses...');
    const addresses = [
      {
        line1: '123 Main Street',
        city: 'Nairobi',
        state: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya',
        latitude: -1.286389,
        longitude: 36.817223,
        formattedAddress: '123 Main Street, Nairobi, Kenya',
      },
      {
        line1: '456 Oak Avenue',
        city: 'Mombasa',
        state: 'Mombasa',
        postalCode: '80100',
        country: 'Kenya',
        latitude: -4.043477,
        longitude: 39.668206,
        formattedAddress: '456 Oak Avenue, Mombasa, Kenya',
      },
      {
        line1: '789 Pine Road',
        city: 'Nakuru',
        state: 'Nakuru',
        postalCode: '20100',
        country: 'Kenya',
        latitude: -0.303099,
        longitude: 36.080026,
        formattedAddress: '789 Pine Road, Nakuru, Kenya',
      },
    ];

    const createdAddresses = [];
    for (const addressData of addresses) {
      const address = await prisma.address.create({
        data: addressData,
      });
      createdAddresses.push(address);
      console.log(`✅ Created address: ${address.formattedAddress}`);
    }

    // Create sample parcels
    console.log('📦 Creating sample parcels...');
    const parcels = [
      {
        description: 'Electronics package',
        weight: 2.5,
        status: 'IN_TRANSIT',
        baseRate: 500,
        weightCharge: 500,
        distanceCharge: 1500,
        totalCost: 2500,
        distanceKm: 30,
        estimatedDeliveryTime: 120,
      },
      {
        description: 'Clothing items',
        weight: 1.0,
        status: 'PENDING',
        baseRate: 500,
        weightCharge: 200,
        distanceCharge: 1000,
        totalCost: 1700,
        distanceKm: 20,
        estimatedDeliveryTime: 90,
      },
      {
        description: 'Documents package',
        weight: 0.5,
        status: 'DELIVERED',
        baseRate: 500,
        weightCharge: 100,
        distanceCharge: 500,
        totalCost: 1100,
        distanceKm: 10,
        estimatedDeliveryTime: 60,
      },
    ];

    for (let i = 0; i < parcels.length; i++) {
      const parcelData = parcels[i];
      const trackingCode =
        'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      const parcel = await prisma.parcel.create({
        data: {
          ...parcelData,
          trackingCode,
          senderId: createdUsers[i % createdUsers.length].id,
          receiverId: createdUsers[(i + 1) % createdUsers.length].id,
          pickupAddressId: createdAddresses[i % createdAddresses.length].id,
          deliveryAddressId:
            createdAddresses[(i + 1) % createdAddresses.length].id,
          courierId: i < 2 ? createdCouriers[i].id : null,
        },
      });

      console.log(
        `✅ Created parcel: ${parcel.description} (${parcel.trackingCode})`,
      );
    }

    // Create admin user
    console.log('👑 Creating admin user...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sendit.com' },
    });

    if (existingAdmin) {
      console.log(
        `⏭️  Admin already exists: ${existingAdmin.name} (${existingAdmin.email})`,
      );
    } else {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@sendit.com',
          password: adminPassword,
          phone: '9999999999',
          role: 'ADMIN',
        },
      });
      console.log(`✅ Created admin: ${adminUser.name} (${adminUser.email})`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`🚚 Couriers: ${createdCouriers.length}`);
    console.log(`📍 Addresses: ${createdAddresses.length}`);
    console.log(`📦 Parcels: ${parcels.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@sendit.com / admin123');
    console.log('Users: john@example.com / password123');
    console.log('Couriers: david@courier.com / courier123');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
