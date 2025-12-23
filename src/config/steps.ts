import type { Section } from '../types';

/**
 * Agreement Sections - Matches Airtable structure exactly
 */

export const sections: Section[] = [
  {
    id: 'intro',
    title: 'Welcome',
    microSteps: [
      {
        id: 'welcome',
        content: `Welcome {{transfereeName}},

Thank you for choosing AutoRelo for your vehicle shipment.

This process will only take a few minutes. Please read each section carefully and provide your initials where required.

This agreement covers important information about your vehicle shipment, including pickup and delivery procedures, coverage, and your responsibilities.

Click "Continue" to begin.`,
      },
    ],
  },
  {
    id: 'section_1',
    title: 'Transit Time',
    requiresInitials: true,
    microSteps: [
      {
        id: 'transit_time',
        content: `TRANSIT TIME:

The designated transit timeframe for your shipment spans {{transitTimeDescription}}.

It is imperative that either you or a designated representative be available at the destination to facilitate the smooth reception of the vehicle within the transit window.

Your arrival window is: {{arrivalWindowStart}} – {{arrivalWindowEnd}}`,
        isImportant: true,
      },
      {
        id: 'availability_date',
        content: `Delivery Availability:

You must specify the earliest date that you or someone on your behalf will be available at the delivery destination to receive your vehicle(s).

This date is considered your earliest available date should the vehicle arrive. This information is used by dispatch to coordinate the truck your vehicle is routed on and your availability date is used for planning a delivery.

Your earliest available delivery date: {{earliestAvailableDeliveryDate}}`,
        hasInput: true,
        inputPlaceholder: 'Confirm or update earliest available date (MM/DD/YYYY)',
      },
    ],
  },
  {
    id: 'section_2',
    title: 'Delivery & Updates',
    requiresInitials: true,
    microSteps: [
      {
        id: 'delivery_process',
        content: `DELIVERY / TRANSIT UPDATES:

Transport ETA updates will be provided to you based on the driver's schedule during the vehicle move. These updates are typically sent via email, so please check your email for updates during your auto move.

We will not have the first update until 2 to 3 working days after pick-up, at which time we can narrow the arrival window down more based on the driver's other stops. We are unable to provide an exact delivery date while the vehicle is in transit, but will narrow it to a 2 to 3 day window.

The car carrier will deliver your vehicle to a local delivery terminal that services your area. Once the vehicle arrives at the terminal, it will be washed (weather permitting) and delivered out to you via flatbed by appointment.

You or someone on your behalf will need to be at the destination during the transit time to take delivery of your vehicle(s). This type of delivery service can occur over a weekend and/or holiday if the terminal is open and available for business.

TERMINAL FEES:
There will be a terminal fee of $250 and storage charges of $25.00 per day/per vehicle that will apply if you or someone on your behalf are unavailable to take delivery during the transit window.

These charges will be the responsibility of the transferee (you) and are payable to our office before delivery of the vehicle unless otherwise instructed by your relocation coordinator. You are not responsible for storage fees prior to your delivery dates should the vehicle arrive any sooner.`,
        isImportant: true,
      },
      {
        id: 'transit_expectations',
        content: `Transit Time Expectations:

Transferring your vehicle will take longer than your household goods. The car carrier has 8-10 spots all going to different locations along the way. The driver has to make up to or in some cases more than ten stops along his route to pick up and/or deliver vehicles during the entire transport time.

Per the D.O.T for safety reasons, drivers are restricted by law to a specific amount of working/driving hours and miles driven per working week.

VEHICLE TRACKING:
If your car is equipped with a tracking device, please note that when you check the location of your vehicle, the device will only show you the last place your vehicle was started. If the vehicle is on the carrier, we do not start it, except if it needs to be loaded/unloaded.

Your tracking device may tell you that your vehicle is still at our origin terminal when in fact it is on its way to the destination. For a more updated delivery timeframe, please contact your customer service representative.`,
      },
      {
        id: 'ev_info',
        content: `Electric Vehicle (EV) Owners:

Please prioritize a full battery charge before shipment. During transit, turn off any modes on the vehicle (e.g., Sentry, Preconditioning), and if equipped, place it in Transport Mode. Avoid pinging the vehicle during transport to conserve battery life.

We cannot guarantee the battery charge upon delivery, and we cannot accept responsibility for your battery draining. We are unable to unload and charge the vehicle during transport.

The GPS on your vehicle will show the last place your vehicle was started, not the physical location of the vehicle.`,
        isImportant: true,
      },
    ],
  },
  {
    id: 'section_3',
    title: 'Releasing & Delivery',
    requiresInitials: true,
    microSteps: [
      {
        id: 'delivery_inspection',
        content: `RELEASING AND TAKING DELIVERY OF YOUR VEHICLE:

You must inspect your vehicle thoroughly at the time of delivery with the delivery driver. Any damage to the vehicle MUST be noted at the time of delivery and noted on the inspection form with the driver. There are no exceptions to this policy.

You will need to then notify our office within 2 business days if you wish to file a claim.

If you are not present at the time of your vehicle pick up or at delivery and you assign someone on your behalf to release the vehicle or take delivery on your behalf, then that person is fully responsible for noting the condition of the vehicle and any existing or new damage regardless of how familiar they are with your vehicle.

Your representative MUST note it at the time of delivery on the inspection form. This will be the only official inspection completed on the vehicle at delivery. Completing another inspection on your own once you actually see the vehicle will not be accepted and finding damage after the fact cannot be claimed.`,
        isImportant: true,
      },
      {
        id: 'pickup_window',
        content: `Pick Up Coordination:

Pickup Date: {{pickupDate}}

The pick-up terminal will call you the morning of the pick-up date to coordinate the pick-up window timeframe.

Please be advised that any modifications, including date changes, alterations to the pickup and delivery addresses, or adjustments to the vehicle details, must be communicated directly with our office.

The pick-up driver or terminal personnel are not authorized to facilitate such changes, as they operate as third-party agents on our behalf within your region.`,
        isImportant: true,
      },
      {
        id: 'inspection_copy',
        content: `Vehicle Inspection Copy:

Upon completion of the vehicle inspection during pick-up, the assigned driver will furnish you with a copy of the inspection form/report.

It is imperative that you retain this document for reference during the delivery process. Having your copy at hand will enable you to conduct a thorough re-inspection of your vehicle, facilitating a comprehensive comparison of its condition at the point of delivery.

Ensure the safekeeping of this document by keeping it with you or securely placing it within the vehicle, so it is readily available.`,
      },
      {
        id: 'cancellation_fees',
        content: `CANCELLATION / DATE CHANGE POLICY:

In the event of cancellation or modification within 3 business days of your scheduled pickup date, a fee of $200.00 per vehicle will be applied. Please note that these fees are not covered by your relocation policy unless specified otherwise.

Should the scheduled vehicle pick-up face hindrance due to mechanical issues, such as a dead battery, resulting in the inability to proceed with the pick-up as planned, a terminal "dry run/attempted pick-up" fee (rate subject to distance and terminal) will be incurred. Additionally, a $200.00 per vehicle carrier cancellation fee will be applicable.

For changes in the pick-up date with less than 1 week (7 days) notice, an extension of at least 4 to 7 days to the transit time will be required to reschedule another carrier.

It is essential to acknowledge that altering a date at any point post-booking may lead to potential delays in rescheduling with carriers.

Please be aware that during the months of May to August, certain dates may require advanced booking, even with a full 2 weeks' notice. Some dates may also become unavailable or fully booked.`,
        isImportant: true,
      },
    ],
  },
  {
    id: 'section_4',
    title: 'General Guidelines',
    requiresInitials: true,
    microSteps: [
      {
        id: 'general_requirements',
        content: `GENERAL GUIDELINES:

Your vehicle must be operable and in good running and braking condition otherwise the carrier will not be able to pick up or transport your vehicle.

Your vehicle will be driven during loading/unloading, which is why we need the manufacturer keys.

You need to advise us if you have made any modification to your vehicle such as 4x4 lift kit, camper shell, lowered, larger tires, attached equipment or any modifications.

If the flatbed truck or car carrier is unable to get "to your door" for either pick-up or delivery, you may be asked to meet the carrier at a suitable nearby location, usually a large open area that is safe for unloading your vehicle.`,
      },
    ],
  },
  {
    id: 'section_5',
    title: 'Personal Items',
    requiresInitials: true,
    microSteps: [
      {
        id: 'items_removal',
        content: `PERSONAL ITEMS:

Remove all personal belongings except for standard vehicle items (jack, spare tire or similar). You may also leave the vehicle papers or other paperwork in the glove box if you choose to. You are allowed to leave your car seat in the vehicle, however please note that we cannot rent you one should your vehicle be delayed.

No other personal items may be shipped in the vehicle for weight and liability reasons. You may not pack/ship anything inside the vehicle or trunk for transport.

Per The Department of Transportation, a car carrier is not licensed to transport personal items and is restricted to a weight limit as well as subject to search at any time.

Sunglasses, misc. personal items, coins, etc. will not be covered for replacement if damaged or missing and should not be left in the vehicle or in any compartment of the vehicle.`,
        isImportant: true,
      },
      {
        id: 'items_fees',
        content: `Personal Items - Additional Fees:

Any items other than the authorized items listed above that are left in the vehicle will be removed and the driver will charge a $200 fee for this delay payable prior to shipment of the vehicle or the actual car transporter may refuse to transport the vehicle.

ARP nor the driver will be held responsible for any personal items. The local pick-up driver from the terminal that will pick up the vehicle from you is not authorized to give permission for you to leave any items in the vehicle.

TOLL TRANSPONDERS & GPS:
If you have a toll road transponder you must remove it from the vehicle. ARP will not be responsible for lost or stolen transponders or any toll charges due to the transponder being left in the vehicle. The carriers will pass through various tolls and your transponder may be automatically charged if you do not remove it.

Any GPS that is not factory installed in the vehicle should be removed from the vehicle. For example, a GPS that is purchased separately, if left in the vehicle even if out of sight or locked, cannot be claimed and will not be replaced.`,
        isImportant: true,
      },
    ],
  },
  {
    id: 'section_6',
    title: 'Vehicle Preparation',
    requiresInitials: true,
    microSteps: [
      {
        id: 'exterior_cleaning',
        content: `PREPARING YOUR VEHICLE FOR SHIPMENT:

The exterior of your vehicle must be clean for the original physical inspection that will be completed for the outside of your vehicle at pick up. Basic exterior wash/cleaning is fine, the vehicle does not need to be detailed.

Failure to provide a clean vehicle for the proper exterior inspection will release all carrier liability and you waive your right to file a claim.`,
        isImportant: true,
      },
      {
        id: 'photo_documentation',
        content: `Photo Documentation:

Please take photos of your vehicle (dated) inside and out at the time of pick up. These pictures are needed in the event you should need to file a claim.

You do not need to send them to us but should be saved until after your vehicle is delivered.`,
        isImportant: true,
      },
      {
        id: 'preparation_checklist',
        content: `Vehicle Preparation Checklist:

• The gas tank should have as low as one quarter tank of fuel if possible. It's okay to have more but don't fill it up right before pick up.

• Removable radios or speaker boxes should be removed from the vehicle. Any items not factory installed.

• All antennas must be fully retracted or removed. We are not responsible for this item. If you have a power antenna, please be sure to turn off your radio.

• You must provide one set of ALL keys for the vehicle and any locked areas as the vehicle is subject to search by the DOT at any time and the driver must have access.

• Non-permanent luggage, bike or ski racks should be removed.

• Prepare your vehicle for the new climate. This may include engine coolant, transmission oil and other fluids.

• If your battery is past the warranty time, the change of climate and the lack of starting the vehicle for several days in a row could cause the battery to drain. This is a maintenance issue and AutoRelocationPlus will not accept liability should the battery need to be replaced.`,
      },
    ],
  },
  {
    id: 'section_7',
    title: 'Inspection & Claims',
    requiresInitials: true,
    microSteps: [
      {
        id: 'filing_claims',
        content: `VEHICLE INSPECTION / DAMAGE and FILING A CLAIM:

You are responsible for filing a claim or reporting damage to our office directly. The delivery driver is a third party and not responsible for reporting regardless of whether he states he will do so.

You do need to advise the driver of the damage during delivery and have it noted on your delivery paperwork and then you must report it to our office directly.

You or your assigned representative must be present for the inspection at time of pick-up and at delivery. You will be asked to sign the bill of lading and condition report at both origin and destination. If you refuse to sign the inspection report, the driver cannot take possession of your vehicle.

Please keep a copy of this form with you to compare with your vehicle at delivery inspection. You are responsible for confirming that your vehicle's condition is the same as when it was picked up. You must do this BEFORE THE DRIVER LEAVES.

If any damage is found then it must be noted in the presence of the driver. You MUST write a clear description of the damage on the inspection form during delivery. If you refuse to sign for delivery, the driver cannot deliver your vehicle to you. It is okay to accept delivery of your vehicle once the damage is noted.

You MUST notify ARP of any damage immediately upon delivery of your vehicle (within 2 business days) via phone or email but preferably email to have the back up.

The damage claim form must be submitted to ARP within 30 days of delivery of your vehicle. This form will be provided by our office.`,
        isImportant: true,
      },
    ],
  },
  {
    id: 'section_8',
    title: 'Coverage Details',
    requiresInitials: true,
    microSteps: [
      {
        id: 'coverage_details',
        content: `THE FOLLOWING COVERAGE IS PROVIDED FOR YOUR VEHICLE:

Your automobile insurance must be in effect during transportation to cover any Acts of God, such as hail, floods or other severe weather conditions.

You are provided with coverage for loss or damage for the Blue Book Value, up to a maximum of $100,000. Claims will only be recognized if a MAJOR change in condition exists AND has been noted by you on the bill of lading at destination.

A claim cannot be submitted for any pre-existing condition. Diminished Value cannot be claimed should repairs to your vehicle be necessary.

We will take every measure possible to keep your vehicle safe from damage. Please keep in mind, your vehicle will travel across country on an open carrier. It will encounter the same elements as if you were driving it yourself. For this reason, ARP cannot be responsible for minor paint chips that your vehicle may incur from any road debris.

CONVERTIBLE VEHICLES:
Please note, your soft top convertible must be road worthy and able to withstand high wind conditions during transport. We can only be responsible for damage done as a result of driver negligence. We cannot take responsibility should your convertible top tear due to wind damage.

INTERIOR COVERAGE:
We are not responsible for any claims relating to damage to the interior of your vehicle as inspections are only completed on the exterior of your vehicle when the vehicle is picked up. Transporting a vehicle would not cause interior damage such as power buttons, glove box closure, knobs, etc.

However if there is a clearly visible area accessed by the driver that was damaged such as a driver's seat cut, tear, etc. as this is the only area he will access, then that may be covered for a claim. We suggest you do take photos of your interior at pick up as this would be used as your inspection showing the interior condition at pick up should you need to file a claim.

NOT COVERED:
Mechanical functions, clutch, exhaust assembly, alignment, brakes, suspension or tuning of engine and the motor on any power doors or windows are not covered. Vehicle transfer on a car carrier does not cause damage to these items and they will not be inspected at pickup.`,
        isImportant: true,
      },
    ],
  },
  {
    id: 'section_9',
    title: 'Delays & Rental Policy',
    requiresInitials: true,
    microSteps: [
      {
        id: 'rental_policy',
        content: `DELAYS / RENTAL CAR:

If for some reason ARP is unable to adhere to the delivery schedule, a rental vehicle, not to exceed $30.00 (thirty dollars) + taxes per day, will be provided at the expense of ARP starting the day after the last day of your transit window.

ARP does not cover charges for gasoline, additional insurance, GPS rentals or any other extras. ARP will arrange a rental vehicle if necessary. We provide a 4 door standard/full size vehicle regardless of the vehicle you are shipping.

ARP has direct bill set up with Enterprise car rental offices except for any airport locations. We are not able to reserve rental vehicles from an airport office.

It is your responsibility to pick up and return the rental to the same location. Transportation to/from and or transportation reimbursement is not provided by ARP. Most rental offices have a pick up and drop off service if you choose a rental office near your home or office.

WINTER WEATHER:
(During winter weather months) Due to the possibility of inclement weather, your vehicle transit time may experience some delay. Please know that we will do everything possible to deliver your vehicle within the delivery spread.`,
      },
    ],
  },
  {
    id: 'signature',
    title: 'Final Signature',
    microSteps: [
      {
        id: 'final_signature',
        content: `SIGNATURE:

By providing your information below, you confirm your comprehension and acceptance of all the aforementioned terms in this Auto-Shipment Agreement.

Failure to sign and return this correspondence may result in the vehicle being declined for transportation services.`,
        isImportant: true,
      },
    ],
  },
];
